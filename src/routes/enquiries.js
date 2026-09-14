import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/enquiry.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { idParam } from '../validators/common.js';
import {
  createEnquirySchema,
  enquiryListQuery,
  updateEnquirySchema,
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
router.get('/admin/enquiries/:id', requireAdmin, validate({ params: idParam }), ctrl.getEnquiry);
router.patch(
  '/admin/enquiries/:id',
  requireAdmin,
  validate({ params: idParam, body: updateEnquirySchema }),
  ctrl.updateEnquiry
);
router.delete('/admin/enquiries/:id', requireAdmin, validate({ params: idParam }), ctrl.deleteEnquiry);

export default router;
