import { Router } from 'express';
import * as users from '../controllers/adminUser.controller.js';
import * as roles from '../controllers/role.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { idParam, paginationQuery } from '../validators/common.js';
import {
  createAdminUserSchema,
  updateAdminUserSchema,
  adminUserListQuery,
  createRoleSchema,
  updateRoleSchema,
  auditListQuery,
} from '../validators/adminUser.validator.js';

const router = Router();

/* ---------- users ---------- */

router.get(
  '/admin/users',
  requireAdmin,
  requirePermission('users.view'),
  validate({ query: adminUserListQuery }),
  users.listAdminUsers
);

router.post(
  '/admin/users',
  requireAdmin,
  requirePermission('users.manage'),
  validate({ body: createAdminUserSchema }),
  users.createAdminUser
);

router.patch(
  '/admin/users/:id',
  requireAdmin,
  requirePermission('users.manage'),
  validate({ params: idParam, body: updateAdminUserSchema }),
  users.updateAdminUser
);

router.delete(
  '/admin/users/:id',
  requireAdmin,
  requirePermission('users.manage'),
  validate({ params: idParam }),
  users.deleteAdminUser
);

/* ---------- roles ---------- */

/* The permission catalogue drives the role editor's checkboxes. Any admin who
   can see the roles screen needs it, so it sits behind users.view. */
router.get(
  '/admin/permissions',
  requireAdmin,
  requirePermission('users.view'),
  roles.getPermissionCatalogue
);

router.get(
  '/admin/roles',
  requireAdmin,
  requirePermission('users.view'),
  validate({ query: paginationQuery }),
  roles.listRoles
);

router.post(
  '/admin/roles',
  requireAdmin,
  requirePermission('roles.manage'),
  validate({ body: createRoleSchema }),
  roles.createRole
);

router.patch(
  '/admin/roles/:id',
  requireAdmin,
  requirePermission('roles.manage'),
  validate({ params: idParam, body: updateRoleSchema }),
  roles.updateRole
);

router.delete(
  '/admin/roles/:id',
  requireAdmin,
  requirePermission('roles.manage'),
  validate({ params: idParam }),
  roles.deleteRole
);

/* ---------- audit ---------- */

router.get(
  '/admin/audit',
  requireAdmin,
  requirePermission('audit.view'),
  validate({ query: auditListQuery }),
  roles.listAuditLog
);

export default router;
