import { ApiError } from '../utils/ApiError.js';

/**
 * Role gate for destructive and site-wide routes.
 *
 * `requireAdmin` only proves that *some* valid account is signed in. The
 * AdminUser schema has always carried role: 'admin' | 'editor', and the JWT has
 * always carried it, but nothing enforced it — so an editor could delete tours
 * and rewrite site settings. Mount this after requireAdmin:
 *
 *   router.delete('/admin/tours/:id', requireAdmin, requireRole('admin'), ...)
 *
 * The role is read from the database record loaded by requireAdmin, not from
 * the token claim, so a role changed after a token was issued takes effect on
 * the next request rather than at token expiry.
 */
export function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.admin?.role;

    if (!role) {
      return next(ApiError.unauthorized('You must sign in to do that.'));
    }

    if (!allowed.includes(role)) {
      return next(
        ApiError.forbidden('Your account does not have permission to do that.')
      );
    }

    next();
  };
}
