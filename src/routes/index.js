import { Router } from 'express';
import mongoose from 'mongoose';
import { sendData } from '../utils/respond.js';

import authRoutes from './auth.js';
import tourRoutes from './tours.js';
import destinationRoutes from './destinations.js';
import blogRoutes from './blog.js';
import testimonialRoutes from './testimonials.js';
import faqRoutes from './faqs.js';
import enquiryRoutes from './enquiries.js';
import settingsRoutes from './settings.js';
import uploadRoutes from './uploads.js';

const router = Router();

router.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  sendData(res, {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    database: states[mongoose.connection.readyState] ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
});

router.use(authRoutes);
router.use(tourRoutes);
router.use(destinationRoutes);
router.use(blogRoutes);
router.use(testimonialRoutes);
router.use(faqRoutes);
router.use(enquiryRoutes);
router.use(settingsRoutes);
router.use(uploadRoutes);

export default router;
