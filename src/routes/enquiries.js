import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/enquiry.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { idParam, bulkIdsSchema } from '../validators/common.js';
import {
  createEnquirySchema,
  enquiryListQuery,
  updateEnquirySchema,
  bulkEnquirySchema,
} from '../validators/enquiry.validator.js';

const router = Router();

// Public write endpoint — keep spam submissions bounded.
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

router.get('/admin/enquiries', requireAdmin, validate({ query: enquiryListQuery }), ctrl.listEnquiries);

/* Bulk triage. Registered before `/:id` so "bulk" is never read as an id. */
router.patch(
  '/admin/enquiries/bulk/status',
  requireAdmin,
  validate({ body: bulkEnquirySchema }),
  ctrl.bulkEnquiryStatus
);
router.delete(
  '/admin/enquiries/bulk',
  requireAdmin,
  requireRole('admin'),
  validate({ body: bulkIdsSchema }),
  ctrl.bulkDeleteEnquiries
);

router.get('/admin/enquiries/:id', requireAdmin, validate({ params: idParam }), ctrl.getEnquiry);
router.patch(
  '/admin/enquiries/:id',
  requireAdmin,
  validate({ params: idParam, body: updateEnquirySchema }),
  ctrl.updateEnquiry
);
/* Deletion is admin-only; editors may triage enquiries but not destroy them. */
router.delete(
  '/admin/enquiries/:id',
  requireAdmin,
  requireRole('admin'),
  validate({ params: idParam }),
  ctrl.deleteEnquiry
);

export default router;
