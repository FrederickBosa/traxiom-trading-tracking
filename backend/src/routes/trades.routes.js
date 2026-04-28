import { Router } from 'express';
import {
  getAllTrades,
  createTrade,
  updateTrade,
  deleteTrade,
} from '../controllers/trades.controller.js';

const router = Router();

router.get('/', getAllTrades);
router.post('/', createTrade);
router.patch('/:id', updateTrade);
router.delete('/:id', deleteTrade);

export default router;
