import { Router } from 'express';
import {
  getAllTrades,
  createTrade,
  updateTrade,
  deleteTrade,
  importTrades,
} from '../controllers/trades.controller.js';

const router = Router();

router.get('/',           getAllTrades);
router.post('/import',    importTrades);   // ← antes del /:id para que no colisione
router.post('/',          createTrade);
router.patch('/:id',      updateTrade);
router.delete('/:id',     deleteTrade);

export default router;
