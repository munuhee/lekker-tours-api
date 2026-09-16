import { Router } from 'express';
import { prisma } from '../config/db.js';
import { createCrudControllers } from '../services/crud.factory.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { idParam, slugParam, bulkIdsSchema, bulkStatusSchema } from '../validators/common.js';
import { statusBodySchema } from '../validators/tour.validator.js';
import { serializeDestination } from '../utils/serialize.js';
import {
  createDestinationSchema,
  updateDestinationSchema,
  destinationListQuery,
} from '../validators/destination.validator.js';

const ctrl = createCrudControllers({
  delegate: prisma.destination,
  label: 'destination',
  titleField: 'name',
  defaultSort: [{ order: 'asc' }, { name: 'asc' }],
  searchFields: ['name', 'tagline'],
  sorts: {
    'order-asc': [{ order: 'asc' }, { name: 'asc' }],
    newest: [{ createdAt: 'desc' }],
    'name-asc': [{ name: 'asc' }],
    'name-desc': [{ name: 'desc' }],
  },
  // parkCount was a Mongoose virtual; the web app renders it on every card.
  serializer: serializeDestination,
  buildFilter: (q) => {
    const f = {};
    if (q.country) f.country = q.country;
    if (q.featured) f.featured = q.featured === 'true';
    return f;
  },
  revalidateTags: (doc) => ['destinations', `destination:${doc.slug}`, 'home'],
});

const router = Router();

router.get('/destinations', validate({ query: destinationListQuery }), ctrl.listPublic);
router.get('/destinations/:slug', validate({ params: slugParam }), ctrl.getPublicBySlug);

router.get('/admin/destinations', requireAdmin, validate({ query: destinationListQuery }), ctrl.listAdmin);

/* Bulk actions mirror the single-item permissions: status for any admin,
   deletion for full admins only. */
router.patch(
  '/admin/destinations/bulk/status',
  requireAdmin,
  validate({ body: bulkStatusSchema }),
  ctrl.bulkStatus
);
router.delete(
  '/admin/destinations/bulk',
  requireAdmin,
  requireRole('admin'),
  validate({ body: bulkIdsSchema }),
  ctrl.bulkRemove
);

router.get('/admin/destinations/:id', requireAdmin, validate({ params: idParam }), ctrl.getAdminById);
router.post('/admin/destinations', requireAdmin, validate({ body: createDestinationSchema }), ctrl.create);
router.patch(
  '/admin/destinations/:id',
  requireAdmin,
  validate({ params: idParam, body: updateDestinationSchema }),
  ctrl.update
);
router.patch(
  '/admin/destinations/:id/status',
  requireAdmin,
  validate({ params: idParam, body: statusBodySchema }),
  ctrl.updateStatus
);
/* Deletion is admin-only; editors may create and edit but not destroy. */
router.delete(
  '/admin/destinations/:id',
  requireAdmin,
  requireRole('admin'),
  validate({ params: idParam }),
  ctrl.remove
);

export default router;
