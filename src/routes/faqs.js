import { Router } from 'express';
import { prisma } from '../config/db.js';
import { createCrudControllers } from '../services/crud.factory.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { idParam } from '../validators/common.js';
import { statusBodySchema } from '../validators/tour.validator.js';
import { createFaqSchema, updateFaqSchema, faqListQuery } from '../validators/content.validator.js';

const ctrl = createCrudControllers({
  delegate: prisma.faq,
  label: 'FAQ',
  slugField: null,
  titleField: null,
  defaultSort: [{ group: 'asc' }, { order: 'asc' }],
  buildFilter: (q) => (q.group ? { group: q.group } : {}),
  revalidateTags: () => ['faqs', 'home'],
});

const router = Router();

router.get('/faqs', validate({ query: faqListQuery }), ctrl.listPublic);

router.get('/admin/faqs', requireAdmin, validate({ query: faqListQuery }), ctrl.listAdmin);
router.get('/admin/faqs/:id', requireAdmin, validate({ params: idParam }), ctrl.getAdminById);
router.post('/admin/faqs', requireAdmin, validate({ body: createFaqSchema }), ctrl.create);
router.patch(
  '/admin/faqs/:id',
  requireAdmin,
  validate({ params: idParam, body: updateFaqSchema }),
  ctrl.update
);
router.patch(
  '/admin/faqs/:id/status',
  requireAdmin,
  validate({ params: idParam, body: statusBodySchema }),
  ctrl.updateStatus
);
/* Deletion is admin-only; editors may create and edit but not destroy. */
router.delete(
  '/admin/faqs/:id',
  requireAdmin,
  requireRole('admin'),
  validate({ params: idParam }),
  ctrl.remove
);

export default router;
