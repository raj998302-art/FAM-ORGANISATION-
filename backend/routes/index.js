import { Router } from 'express';
import featuresRouter from './features.routes.js';

import dbRoutes from './db.routes.js'; // Register model first
import authRoutes from './auth.routes.js';
import paymentRoutes from './payment.routes.js';
import uploadRoutes from './upload.routes.js';
import tournamentRoutes from './tournament.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Wrap the generic data models
router.use('/entities', dbRoutes);
router.use('/auth', authRoutes);
router.use('/payments', paymentRoutes);
router.use('/upload', uploadRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/admin', adminRoutes);
router.use('/features', featuresRouter);

export default router;
