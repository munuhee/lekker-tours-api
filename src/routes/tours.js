import { Router } from 'express';
import * as ctrl from '../controllers/tour.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { idParam, slugParam, bulkIdsSchema, bulkStatusSchema } from '../validators/common.js';
import {
  createTourSchema,
  updateTourSchema,
  tourListQuery,
  adminTourListQuery,
  statusBodySchema,
} from '../validators/tour.validator.js';

const router = Router();

/* Public: published tours only. */
router.get('/tours', validate({ query: tourListQuery }), ctrl.listPublicTours);
router.get('/tours/:slug', validate({ params: slugParam }), ctrl.getPublicTour);
router.get('/tours/:slug/related', validate({ params: slugParam }), ctrl.getRelated);

/* Admin: includes drafts. */
router.get('/admin/tours', requireAdmin, validate({ query: adminTourListQuery }), ctrl.listAdminTours);

/* Bulk actions mirror the single-item permissions: status for any admin,
   deletion for full admins only. Registered before `/:id` so that "bulk" is
   never parsed as a tour id. */
router.patch(
  '/admin/tours/bulk/status',
  requireAdmin,
  validate({ body: bulkStatusSchema }),
  ctrl.bulkTourStatus
);
router.delete(
  '/admin/tours/bulk',
  requireAdmin,
  requireRole('admin'),
  validate({ body: bulkIdsSchema }),
  ctrl.bulkDeleteTours
);

router.get('/admin/tours/:id', requireAdmin, validate({ params: idParam }), ctrl.getAdminTour);
router.post('/admin/tours', requireAdmin, validate({ body: createTourSchema }), ctrl.createTour);
router.patch(
  '/admin/tours/:id',
  requireAdmin,
  validate({ params: idParam, body: updateTourSchema }),
  ctrl.updateTour
);
router.patch(
  '/admin/tours/:id/status',
  requireAdmin,
  validate({ params: idParam, body: statusBodySchema }),
  ctrl.updateTourStatus
);
/* Deletion is admin-only; editors may create and edit but not destroy. */
router.delete(
  '/admin/tours/:id',
  requireAdmin,
  requireRole('admin'),
  validate({ params: idParam }),
  ctrl.deleteTour
);

export default router;
