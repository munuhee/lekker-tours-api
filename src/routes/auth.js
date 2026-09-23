import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginSchema } from '../validators/auth.validator.js';

const router = Router();

// Brute-force guard on the only unauthenticated write endpoint. It counts
// failed attempts only: a successful sign-in is not evidence of an attack, and
// counting it meant a legitimate admin who mistyped a few times could be locked
// out while holding the correct password. skipSuccessfulRequests also keeps a
// shared office IP from exhausting the window for everyone behind it.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message:
        'Too many failed sign-in attempts from this address. Try again in about 15 minutes.',
      code: 'RATE_LIMITED',
    },
  },
});

router.post('/auth/login', loginLimiter, validate({ body: loginSchema }), ctrl.login);
router.post('/auth/logout', requireAdmin, ctrl.logout);
router.get('/auth/me', requireAdmin, ctrl.me);

export default router;
