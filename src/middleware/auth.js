import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/db.js';

export const AUTH_COOKIE = 'lekker_admin_token';

export function signAdminToken(admin) {
  return jwt.sign({ sub: String(admin.id), role: admin.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax', // localhost:3000 -> :4000 is same-site; 'none' would need secure:true
    secure: env.isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { path: '/' });
}

/** Rejects the request unless a valid admin JWT cookie is present. */
export async function requireAdmin(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return next(ApiError.unauthorized('You must sign in to do that.'));

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    clearAuthCookie(res);
    return next(ApiError.unauthorized('Your session has expired. Please sign in again.'));
  }

  // A token issued before the Postgres migration carries a 24-hex Mongo id,
  // which is not a valid UUID and would make Prisma throw rather than miss.
  let admin = null;
  try {
    admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
  } catch {
    admin = null;
  }

  if (!admin) {
    clearAuthCookie(res);
    return next(ApiError.unauthorized('That account no longer exists.'));
  }

  req.admin = admin;
  next();
}
