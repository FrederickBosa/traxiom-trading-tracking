import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tradesRoutes from './trades.routes.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/trades', authMiddleware, tradesRoutes);

export default router;
