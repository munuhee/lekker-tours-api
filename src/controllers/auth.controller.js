import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/respond.js';
import { signAdminToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { permissionsFor } from '../middleware/requirePermission.js';

function publicShape(admin) {
  return {
    id: admin.id,
    _id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    // The dashboard hides controls the signed-in user cannot use, so it needs
    // the resolved permission list rather than the role name alone.
    roleName: admin.roleRef?.name ?? null,
    permissions: permissionsFor(admin),
    lastLoginAt: admin.lastLoginAt,
  };
}

export async function login(req, res) {
  const { email, password } = req.body;

  // Unlike the old schema, Postgres has no select:false — the hash comes back
  // on every read, so it must never be handed to a serializer. publicShape()
  // is the only thing that reaches the client.
  const admin = await prisma.adminUser.findUnique({
    where: { email },
    include: { roleRef: true },
  });

  // Same message for unknown email and wrong password — don't reveal which.
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    throw ApiError.unauthorized('Those credentials do not match our records.');
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
    include: { roleRef: true },
  });

  setAuthCookie(res, signAdminToken(updated));
  sendData(res, publicShape(updated));
}

export async function logout(req, res) {
  clearAuthCookie(res);
  sendData(res, { loggedOut: true });
}

export async function me(req, res) {
  sendData(res, publicShape(req.admin));
}
