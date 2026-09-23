import { ApiError } from '../utils/ApiError.js';
import { ALL_PERMISSIONS } from '../config/permissions.js';

/**
 * Permission gate. Supersedes requireRole() for everything gated by the roles
 * table; requireRole() remains only for routes still on the coarse enum.
 *
 * Permissions are read from the role record loaded alongside the user in
 * requireAdmin, not from the JWT, so revoking access takes effect on the
 * next request rather than whenever the token happens to expire.
 */
export function permissionsFor(admin) {
  if (!admin) return [];
  // A locked role (Administrator) holds everything, including permissions
  // introduced by a later release than the row was written.
  if (admin.roleRef?.locked) return ALL_PERMISSIONS;
  if (admin.roleRef) return admin.roleRef.permissions ?? [];
  // Fallback for accounts created before the roles table, so a legacy
  // administrator is never locked out by a deploy.
  return admin.role === 'admin' ? ALL_PERMISSIONS : [];
}

export function hasPermission(admin, permission) {
  return permissionsFor(admin).includes(permission);
}

export function requirePermission(...required) {
  return (req, res, next) => {
    if (!req.admin) {
      return next(ApiError.unauthorized('You must sign in to do that.'));
    }

    const held = permissionsFor(req.admin);
    const missing = required.filter((p) => !held.includes(p));

    if (missing.length) {
      return next(
        ApiError.forbidden('Your role does not include permission to do that.')
      );
    }

    next();
  };
}
