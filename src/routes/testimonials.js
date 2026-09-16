import { Router } from 'express';
import { prisma } from '../config/db.js';
import { createCrudControllers } from '../services/crud.factory.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { idParam, bulkIdsSchema, bulkStatusSchema } from '../validators/common.js';
import { statusBodySchema } from '../validators/tour.validator.js';
import {
  createTestimonialSchema,
  updateTestimonialSchema,
  testimonialListQuery,
} from '../validators/content.validator.js';

const ctrl = createCrudControllers({
  delegate: prisma.testimonial,
  label: 'testimonial',
  slugField: null, // testimonials have no public URL of their own
  titleField: null,
  defaultSort: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
  searchFields: ['authorName', 'quote'],
  sorts: {
    newest: [{ createdAt: 'desc' }],
    oldest: [{ createdAt: 'asc' }],
    'author-asc': [{ authorName: 'asc' }],
    'rating-desc': [{ rating: 'desc' }, { createdAt: 'desc' }],
  },
  buildFilter: (q) => (q.featured ? { featured: q.featured === 'true' } : {}),
  revalidateTags: () => ['testimonials', 'home'],
});

const router = Router();

router.get('/testimonials', validate({ query: testimonialListQuery }), ctrl.listPublic);

router.get('/admin/testimonials', requireAdmin, validate({ query: testimonialListQuery }), ctrl.listAdmin);
router.get('/admin/testimonials/:id', requireAdmin, validate({ params: idParam }), ctrl.getAdminById);
router.post('/admin/testimonials', requireAdmin, validate({ body: createTestimonialSchema }), ctrl.create);
router.patch(
  '/admin/testimonials/:id',
  requireAdmin,
  validate({ params: idParam, body: updateTestimonialSchema }),
  ctrl.update
);
router.patch(
  '/admin/testimonials/:id/status',
  requireAdmin,
  validate({ params: idParam, body: statusBodySchema }),
  ctrl.updateStatus
);
/* Bulk actions mirror the single-item permissions: status for any admin,
   deletion for full admins only. */
router.patch(
  '/admin/testimonials/bulk/status',
  requireAdmin,
  validate({ body: bulkStatusSchema }),
  ctrl.bulkStatus
);
router.delete(
  '/admin/testimonials/bulk',
  requireAdmin,
  requireRole('admin'),
  validate({ body: bulkIdsSchema }),
  ctrl.bulkRemove
);

/* Deletion is admin-only; editors may create and edit but not destroy. */
router.delete(
  '/admin/testimonials/:id',
  requireAdmin,
  requireRole('admin'),
  validate({ params: idParam }),
  ctrl.remove
);

export default router;
