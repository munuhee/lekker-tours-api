import { Router } from 'express';
import * as ctrl from '../controllers/settings.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { updateSettingsSchema } from '../validators/settings.validator.js';

const router = Router();

router.get('/settings', ctrl.getSettings);

/* Site-wide settings affect every public page, so they are admin-only. */
router.patch(
  '/admin/settings',
  requireAdmin,
  requireRole('admin'),
  validate({ body: updateSettingsSchema }),
  ctrl.updateSettings
);

export default router;
