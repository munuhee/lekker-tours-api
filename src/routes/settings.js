import { Router } from 'express';
import * as ctrl from '../controllers/settings.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { updateSettingsSchema } from '../validators/settings.validator.js';

const router = Router();

router.get('/settings', ctrl.getSettings);
router.patch('/admin/settings', requireAdmin, validate({ body: updateSettingsSchema }), ctrl.updateSettings);

export default router;
