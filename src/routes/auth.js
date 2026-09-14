import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginSchema } from '../validators/auth.validator.js';

const router = Router();

// Blunt brute-force guard on the only unauthenticated write endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many sign-in attempts. Try again in a few minutes.', code: 'RATE_LIMITED' },
  },
});

router.post('/auth/login', loginLimiter, validate({ body: loginSchema }), ctrl.login);
router.post('/auth/logout', requireAdmin, ctrl.logout);
router.get('/auth/me', requireAdmin, ctrl.me);

export default router;
