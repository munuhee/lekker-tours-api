import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Origin check on cookie-authenticated writes.
 *
 * This is the primary CSRF defence, not a belt-and-braces one. The session
 * cookie is sameSite:'none' in production — it has to be, because the web app
 * and this API are separate hosts and a 'lax' cookie would never be sent back
 * (see middleware/auth.js) — so the browser offers no cross-site protection of
 * its own. Given this API exposes uploads and DELETEs, the declared origin is
 * verified explicitly on every state-changing request.
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
