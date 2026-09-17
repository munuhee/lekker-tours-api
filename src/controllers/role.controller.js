import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData, buildPageMeta } from '../utils/respond.js';
import { writeAudit } from '../utils/audit.js';
import { PERMISSION_GROUPS, ALL_PERMISSIONS } from '../config/permissions.js';

function publicShape(role) {
  return {
    id: role.id,
    _id: role.id,
    name: role.name,
    description: role.description,
    // A locked role holds everything by definition, including permissions
    // added after the row was written — report that, not the stored array.
    permissions: role.locked ? ALL_PERMISSIONS : role.permissions,
    locked: role.locked,
    userCount: role._count?.users ?? undefined,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

/** The permission catalogue, so the role editor renders itself from the API. */
export async function getPermissionCatalogue(req, res) {
  sendData(res, { groups: PERMISSION_GROUPS });
}

export async function listRoles(req, res) {
  const { page, limit } = req.query;

  const [items, total] = await Promise.all([
    prisma.role.findMany({
      orderBy: [{ locked: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { users: true } } },
    }),
    prisma.role.count(),
  ]);

  sendData(res, items.map(publicShape), { meta: buildPageMeta({ page, limit, total }) });
}

export async function createRole(req, res) {
  const { name, description, permissions } = req.body;

  const clash = await prisma.role.findUnique({ where: { name } });
  if (clash) throw ApiError.badRequest('A role with that name already exists.');

  const role = await prisma.role.create({
    data: { name, description: description ?? '', permissions, locked: false },
  });

  await writeAudit(req, {
    action: 'role.create',
    target: { type: 'role', id: role.id, label: role.name },
    changes: { after: { name, permissions } },
  });

  sendData(res, publicShape(role), { status: 201 });
}

export async function updateRole(req, res) {
  const { id } = req.params;
  const { name, description, permissions } = req.body;

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw ApiError.notFound('That role no longer exists.');

  // The Administrator role is the recovery path: if it could be edited, a
  // mistaken save could leave nobody able to grant permissions back.
  if (role.locked) {
    throw ApiError.badRequest('The Administrator role cannot be changed.');
  }

  if (name && name !== role.name) {
    const clash = await prisma.role.findUnique({ where: { name } });
    if (clash) throw ApiError.badRequest('A role with that name already exists.');
  }

  const data = {};
  if (name) data.name = name;
  if (description !== undefined) data.description = description;
  if (permissions) data.permissions = permissions;

  const updated = await prisma.role.update({ where: { id }, data });

  await writeAudit(req, {
    action: 'role.update',
    target: { type: 'role', id: role.id, label: updated.name },
    changes: {
      before: { name: role.name, permissions: role.permissions },
      after: { name: updated.name, permissions: updated.permissions },
    },
  });

  sendData(res, publicShape(updated));
}

export async function deleteRole(req, res) {
  const { id } = req.params;

  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) throw ApiError.notFound('That role no longer exists.');

  if (role.locked) {
    throw ApiError.badRequest('The Administrator role cannot be deleted.');
  }

  // onDelete: SetNull would silently strip these users of every permission.
  if (role._count.users > 0) {
    throw ApiError.badRequest(
      `${role._count.users} ${role._count.users === 1 ? 'account uses' : 'accounts use'} this role. Move them to another role first.`
    );
  }

  await prisma.role.delete({ where: { id } });

  await writeAudit(req, {
    action: 'role.delete',
    target: { type: 'role', id, label: role.name },
    changes: { before: { name: role.name, permissions: role.permissions } },
  });

  sendData(res, { deleted: true, id });
}

/* ---------- audit ---------- */

export async function listAuditLog(req, res) {
  const { page, limit, action } = req.query;

  const where = {};
  if (action) where.action = action;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  sendData(
    res,
    items.map((entry) => ({ ...entry, _id: entry.id })),
    { meta: buildPageMeta({ page, limit, total }) }
  );
}
