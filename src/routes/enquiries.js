import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/enquiry.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { idParam, bulkIdsSchema } from '../validators/common.js';
import {
  createEnquirySchema,
  enquiryListQuery,
  updateEnquirySchema,
  bulkEnquirySchema,
  bulkAssignSchema,
  statusChangeSchema,
  assignSchema,
  noteSchema,
  contactedSchema,
} from '../validators/enquiry.validator.js';

const router = Router();

// Public write endpoint: keep spam submissions bounded.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many enquiries from this address. Please try again later.', code: 'RATE_LIMITED' },
  },
});

router.post('/enquiries', submitLimiter, validate({ body: createEnquirySchema }), ctrl.submitEnquiry);

router.get(
  '/admin/enquiries',
  requireAdmin,
  requirePermission('enquiries.view'),
  validate({ query: enquiryListQuery }),
  ctrl.listEnquiries
);

/* Assignable staff, for the assignee dropdown. Before `/:id` so "assignable"
 * is never read as an id. */
router.get(
  '/admin/enquiries/assignable',
  requireAdmin,
  requirePermission('enquiries.view'),
  ctrl.listAssignableStaff
);

/* Bulk actions. Registered before `/:id` so "bulk" is never read as an id. */
router.patch(
  '/admin/enquiries/bulk/status',
  requireAdmin,
  requirePermission('enquiries.edit'),
  validate({ body: bulkEnquirySchema }),
  ctrl.bulkEnquiryStatus
);
router.patch(
  '/admin/enquiries/bulk/assign',
  requireAdmin,
  requirePermission('enquiries.assign'),
  validate({ body: bulkAssignSchema }),
  ctrl.bulkAssignEnquiries
);
router.delete(
  '/admin/enquiries/bulk',
  requireAdmin,
  requirePermission('enquiries.delete'),
  validate({ body: bulkIdsSchema }),
  ctrl.bulkDeleteEnquiries
);

router.get(
  '/admin/enquiries/:id',
  requireAdmin,
  requirePermission('enquiries.view'),
  validate({ params: idParam }),
  ctrl.getEnquiry
);

/* Pipeline actions. Each appends to the activity log, which is why they are
 * separate endpoints rather than fields on the PATCH below. */
router.patch(
  '/admin/enquiries/:id/status',
  requireAdmin,
  requirePermission('enquiries.edit'),
  validate({ params: idParam, body: statusChangeSchema }),
  ctrl.changeStatus
);

/* Claiming unowned work needs only triage; the controller rejects a claim on an
 * enquiry someone else already holds. Handing one to another person is the
 * management action, so the body carrying an explicit assigneeId is what
 * `enquiries.assign` guards, checked in the controller, since the two cases
 * share a route. */
router.patch(
  '/admin/enquiries/:id/assignee',
  requireAdmin,
  requirePermission('enquiries.edit'),
  validate({ params: idParam, body: assignSchema }),
  ctrl.assignEnquiry
);

router.post(
  '/admin/enquiries/:id/notes',
  requireAdmin,
  requirePermission('enquiries.edit'),
  validate({ params: idParam, body: noteSchema }),
  ctrl.addNote
);

router.post(
  '/admin/enquiries/:id/contacted',
  requireAdmin,
  requirePermission('enquiries.edit'),
  validate({ params: idParam, body: contactedSchema }),
  ctrl.recordContact
);

router.patch(
  '/admin/enquiries/:id',
  requireAdmin,
  requirePermission('enquiries.edit'),
  validate({ params: idParam, body: updateEnquirySchema }),
  ctrl.updateEnquiry
);

router.delete(
  '/admin/enquiries/:id',
  requireAdmin,
  requirePermission('enquiries.delete'),
  validate({ params: idParam }),
  ctrl.deleteEnquiry
);

export default router;
