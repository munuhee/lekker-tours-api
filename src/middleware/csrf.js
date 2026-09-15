import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Origin check on cookie-authenticated writes.
 *
 * The session cookie is sameSite:'lax', which stops cross-*site* form posts in
 * current browsers — but "site" is the registrable domain, so any subdomain
 * sharing it can still forge a state-changing request, and lax is a browser
 * policy rather than a server guarantee. Given this API exposes uploads and
 * DELETEs, verify the declared origin explicitly.
 *
 * Only unsafe methods are checked. Requests with neither Origin nor Referer are
 * rejected too: every browser sends Origin on cross-origin writes, so a missing
 * one on a state-changing request is not something a real admin session does.
 */
export function verifyOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const allowed = env.webOrigin;
  const origin = req.get('origin');

  if (origin) {
    if (origin === allowed) return next();
    return next(ApiError.forbidden('This request came from an unrecognised origin.'));
  }

  // Fall back to Referer for the rare client that omits Origin.
  const referer = req.get('referer');
  if (referer) {
    try {
      if (new URL(referer).origin === allowed) return next();
    } catch {
      // Malformed Referer — treat as untrusted.
    }
  }

  return next(ApiError.forbidden('This request came from an unrecognised origin.'));
}
