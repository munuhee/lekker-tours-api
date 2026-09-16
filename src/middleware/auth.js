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

/**
 * In development the web app and the API share a host (localhost:3000 ->
 * :4000), so 'lax' holds and works without HTTPS. In production they are
 * separate hosts — lekkertours.com and api.lekkertours.com — which the browser
 * treats as cross-site, and a 'lax' cookie set by the API is never sent back
 * from the web app. That silently breaks admin sign-in: the login succeeds, the
 * cookie is dropped, and every subsequent request looks unauthenticated.
 *
 * 'none' is what permits the cross-site send, and browsers only accept it
 * alongside Secure — which production already sets. The CSRF protection this
 * gives up is covered by the explicit Origin check in middleware/csrf.js.
 */
const cookieOptions = {
  httpOnly: true,
  sameSite: env.isProduction ? 'none' : 'lax',
  secure: env.isProduction,
  path: '/',
  // Scoped to the registrable parent in production (see config/env.js), so the
  // web app's server-side session check can read it. Host-only otherwise.
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
};

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// Must mirror the attributes above: a cookie cleared with different sameSite or
// secure values is a different cookie to the browser, so logout would no-op.
export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
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
