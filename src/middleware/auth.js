import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { AdminUser } from '../models/AdminUser.js';

export const AUTH_COOKIE = 'lekker_admin_token';

export function signAdminToken(admin) {
  return jwt.sign({ sub: String(admin._id), role: admin.role }, env.jwtSecret, {
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

  const admin = await AdminUser.findById(payload.sub);
  if (!admin) {
    clearAuthCookie(res);
    return next(ApiError.unauthorized('That account no longer exists.'));
  }

  req.admin = admin;
  next();
}
