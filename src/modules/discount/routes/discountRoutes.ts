// src/routes/discountRoutes.ts
import express from 'express';
import { addDiscount, removeDiscount, updateDiscount } from '../controllers/index';
import { authenticateSeller, authorizeSeller } from '../../../middleware/authMiddleware';

const router = express.Router();

router.post('/discount', authenticateSeller, authorizeSeller, addDiscount);
router.put('/discount', authenticateSeller, authorizeSeller, updateDiscount);
router.delete('/discount', authenticateSeller, authorizeSeller, removeDiscount);

export default router;
