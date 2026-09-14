import { Router } from 'express';
import { Testimonial } from '../models/Testimonial.js';
import { createCrudControllers } from '../services/crud.factory.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { idParam } from '../validators/common.js';
import { statusBodySchema } from '../validators/tour.validator.js';
import {
  createTestimonialSchema,
  updateTestimonialSchema,
  testimonialListQuery,
} from '../validators/content.validator.js';

const ctrl = createCrudControllers({
  Model: Testimonial,
  label: 'testimonial',
  slugField: null, // testimonials have no public URL of their own
  titleField: null,
  defaultSort: { featured: -1, order: 1, createdAt: -1 },
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
router.delete('/admin/testimonials/:id', requireAdmin, validate({ params: idParam }), ctrl.remove);

export default router;
