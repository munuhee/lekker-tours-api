import { Router } from 'express';
import { prisma } from '../config/db.js';
import { createCrudControllers } from '../services/crud.factory.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { idParam, slugParam } from '../validators/common.js';
import { statusBodySchema } from '../validators/tour.validator.js';
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  blogListQuery,
} from '../validators/content.validator.js';

const ctrl = createCrudControllers({
  delegate: prisma.blogPost,
  label: 'post',
  defaultSort: [{ publishedAt: 'desc' }],
  buildFilter: (q) => {
    const f = {};
    // `tags` is a Postgres text[]; `has` is the array-contains test.
    if (q.tag) f.tags = { has: q.tag.toLowerCase() };
    if (q.featured) f.featured = q.featured === 'true';
    return f;
  },
  revalidateTags: (doc) => ['blog', `post:${doc.slug}`, 'home'],
});

const router = Router();

router.get('/blog', validate({ query: blogListQuery }), ctrl.listPublic);
router.get('/blog/:slug', validate({ params: slugParam }), ctrl.getPublicBySlug);

router.get('/admin/blog', requireAdmin, validate({ query: blogListQuery }), ctrl.listAdmin);
router.get('/admin/blog/:id', requireAdmin, validate({ params: idParam }), ctrl.getAdminById);
router.post('/admin/blog', requireAdmin, validate({ body: createBlogPostSchema }), ctrl.create);
router.patch(
  '/admin/blog/:id',
  requireAdmin,
  validate({ params: idParam, body: updateBlogPostSchema }),
  ctrl.update
);
router.patch(
  '/admin/blog/:id/status',
  requireAdmin,
  validate({ params: idParam, body: statusBodySchema }),
  ctrl.updateStatus
);
/* Deletion is admin-only; editors may create and edit but not destroy. */
router.delete(
  '/admin/blog/:id',
  requireAdmin,
  requireRole('admin'),
  validate({ params: idParam }),
  ctrl.remove
);

export default router;
