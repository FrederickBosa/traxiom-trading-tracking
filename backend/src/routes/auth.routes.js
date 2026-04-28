import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { getMe } from '../controllers/auth.controller.js';

const router = Router();

router.get('/me', authMiddleware, getMe);

export default router;
