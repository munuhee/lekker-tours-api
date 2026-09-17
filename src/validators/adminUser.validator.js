import { z } from 'zod';
import { paginationQuery, searchQuery, objectId } from './common.js';
import { isPermission } from '../config/permissions.js';

/**
 * Twelve characters rather than the usual eight. These accounts can publish to
 * the public site and read every enquiry, and there is no second factor behind
 * them, so the password is the whole defence.
 */
const password = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(200, 'That password is too long.');

export const createAdminUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  name: z.string().trim().min(2, 'Enter a name.').max(120),
  password,
  roleId: objectId,
});

/**
 * Every field optional: the form PATCHes only what changed. An absent password
 * leaves the existing hash alone, which is what makes "rename this person"
 * safe to submit without retyping their password.
 */
export const updateAdminUserSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').optional(),
    name: z.string().trim().min(2, 'Enter a name.').max(120).optional(),
    password: password.optional(),
    roleId: objectId.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'Nothing to update.' });

export const adminUserListQuery = paginationQuery.extend({
  q: searchQuery,
  roleId: objectId.optional(),
  sort: z.enum(['newest', 'oldest', 'name-asc', 'email-asc']).optional(),
});

/**
 * Unknown permission strings are rejected rather than ignored: a typo that
 * silently stored a permission nothing checks would read as granted in the UI
 * while doing nothing.
 */
const permissionList = z
  .array(z.string())
  .max(200)
  .refine((list) => list.every(isPermission), {
    message: 'That permission list contains an unknown permission.',
  });

export const createRoleSchema = z.object({
  name: z.string().trim().min(2, 'Name the role.').max(60),
  description: z.string().trim().max(300).optional(),
  permissions: permissionList,
});

export const updateRoleSchema = z
  .object({
    name: z.string().trim().min(2, 'Name the role.').max(60).optional(),
    description: z.string().trim().max(300).optional(),
    permissions: permissionList.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'Nothing to update.' });

export const auditListQuery = paginationQuery.extend({
  action: z.string().trim().max(60).optional(),
});
