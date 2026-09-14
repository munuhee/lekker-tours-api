import { AdminUser } from '../models/AdminUser.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/respond.js';
import { signAdminToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';

function publicShape(admin) {
  return {
    id: admin._id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    lastLoginAt: admin.lastLoginAt,
  };
}

export async function login(req, res) {
  const { email, password } = req.body;

  // Select the hash explicitly; the schema hides it by default.
  const admin = await AdminUser.findOne({ email }).select('+passwordHash');

  // Same message for unknown email and wrong password — don't reveal which.
  if (!admin || !(await admin.verifyPassword(password))) {
    throw ApiError.unauthorized('Those credentials do not match our records.');
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  setAuthCookie(res, signAdminToken(admin));
  sendData(res, publicShape(admin));
}

export async function logout(req, res) {
  clearAuthCookie(res);
  sendData(res, { loggedOut: true });
}

export async function me(req, res) {
  sendData(res, publicShape(req.admin));
}
