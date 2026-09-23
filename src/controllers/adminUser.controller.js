import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData, buildPageMeta } from '../utils/respond.js';
import { writeAudit, recordChanges } from '../utils/audit.js';
import { permissionsFor } from '../middleware/requirePermission.js';

/**
 * The bcrypt hash is a real column and comes back on every Prisma read, so it
 * must never reach the client. This is the only shape these handlers send,
 * mirrors publicShape() in auth.controller.js deliberately.
 */
function publicShape(admin) {
  return {
    id: admin.id,
    _id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.roleRef
      ? { id: admin.roleRef.id, name: admin.roleRef.name, locked: admin.roleRef.locked }
      : null,
    roleId: admin.roleId ?? null,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

const ADMIN_SORTS = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  'name-asc': [{ name: 'asc' }],
  'email-asc': [{ email: 'asc' }],
};

/** Cost 12, matching seed/admin.js; changing it here alone would be invisible. */
const BCRYPT_ROUNDS = 12;

const WITH_ROLE = { include: { roleRef: true } };

/**
 * The legacy `role` enum still gates routes that have not moved to permission
 * checks, so it is kept in step with the assigned role: anyone who can manage
 * users or edit settings is an 'admin' there, everyone else an 'editor'.
 */
function legacyRoleFor(role) {
  if (!role) return 'editor';
  if (role.locked) return 'admin';
  const perms = role.permissions ?? [];
  return perms.includes('users.manage') || perms.includes('settings.edit') ? 'admin' : 'editor';
}

async function loadRoleOrThrow(roleId) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.badRequest('That role does not exist.');
  return role;
}

/**
 * Guard against locking everyone out of the dashboard. Any change that would
 * leave nobody able to manage users, deleting the last such account, or moving
 * it to a role without `users.manage`, produces a site recoverable only by
 * shell access to the server.
 */
async function assertNotLastManager(userId, { action }) {
  const managers = await prisma.adminUser.findMany({
    ...WITH_ROLE,
    where: { roleId: { not: null } },
  });

  const others = managers.filter(
    (u) => u.id !== userId && permissionsFor(u).includes('users.manage')
  );

  if (others.length === 0) {
    throw ApiError.badRequest(
      `This is the only account that can manage users. Give another account that permission before ${action} it.`
    );
  }
}

/* ---------- users ---------- */

export async function listAdminUsers(req, res) {
  const { page, limit, q, roleId, sort } = req.query;

  const where = {};
  if (roleId) where.roleId = roleId;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.adminUser.findMany({
      ...WITH_ROLE,
      where,
      orderBy: ADMIN_SORTS[sort] ?? ADMIN_SORTS['name-asc'],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminUser.count({ where }),
  ]);

  sendData(res, items.map(publicShape), { meta: buildPageMeta({ page, limit, total }) });
}

export async function createAdminUser(req, res) {
  const { email, name, password, roleId } = req.body;

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.badRequest('An account with that email address already exists.');
  }

  const role = await loadRoleOrThrow(roleId);

  const admin = await prisma.adminUser.create({
    ...WITH_ROLE,
    data: {
      email,
      name,
      roleId,
      role: legacyRoleFor(role),
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    },
  });

  await writeAudit(req, {
    action: 'user.create',
    target: { type: 'user', id: admin.id, label: admin.email },
    changes: { after: { name, email, role: role.name } },
  });

  sendData(res, publicShape(admin), { status: 201 });
}

export async function updateAdminUser(req, res) {
  const { id } = req.params;
  const { email, name, password, roleId } = req.body;

  const target = await prisma.adminUser.findUnique({ where: { id }, ...WITH_ROLE });
  if (!target) throw ApiError.notFound('That account no longer exists.');

  if (email && email !== target.email) {
    const clash = await prisma.adminUser.findUnique({ where: { email } });
    if (clash) throw ApiError.badRequest('An account with that email address already exists.');
  }

  const data = {};
  if (email) data.email = email;
  if (name) data.name = name;
  if (password) data.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let nextRole = target.roleRef;
  if (roleId && roleId !== target.roleId) {
    nextRole = await loadRoleOrThrow(roleId);

    // Moving yourself to a role that cannot manage users is how an admin locks
    // the door from the inside: the request succeeds, the next one is refused.
    const losingSelfManagement =
      id === req.admin.id && !(nextRole.locked || nextRole.permissions.includes('users.manage'));
    if (losingSelfManagement) {
      throw ApiError.badRequest('You cannot remove your own access to user management.');
    }

    if (permissionsFor(target).includes('users.manage')) {
      await assertNotLastManager(id, { action: 'changing the role of' });
    }

    data.roleId = roleId;
    data.role = legacyRoleFor(nextRole);
  }

  const admin = await prisma.adminUser.update({ where: { id }, data, ...WITH_ROLE });

  const changes = recordChanges(
    { name: target.name, email: target.email, role: target.roleRef?.name ?? null },
    {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(password ? { password } : {}),
      ...(roleId && roleId !== target.roleId ? { role: nextRole?.name ?? null } : {}),
    }
  );

  await writeAudit(req, {
    action: roleId && roleId !== target.roleId ? 'user.role_change' : 'user.update',
    target: { type: 'user', id: admin.id, label: admin.email },
    changes,
  });

  sendData(res, publicShape(admin));
}

export async function deleteAdminUser(req, res) {
  const { id } = req.params;

  // Deleting the account you are signed in as invalidates your own session on
  // the very next request, so refuse it outright rather than explain later.
  if (id === req.admin.id) {
    throw ApiError.badRequest('You cannot delete the account you are signed in with.');
  }

  const target = await prisma.adminUser.findUnique({ where: { id }, ...WITH_ROLE });
  if (!target) throw ApiError.notFound('That account no longer exists.');

  if (permissionsFor(target).includes('users.manage')) {
    await assertNotLastManager(id, { action: 'deleting' });
  }

  await prisma.adminUser.delete({ where: { id } });

  await writeAudit(req, {
    action: 'user.delete',
    target: { type: 'user', id, label: target.email },
    changes: { before: { name: target.name, email: target.email, role: target.roleRef?.name ?? null } },
  });

  sendData(res, { deleted: true, id });
}
