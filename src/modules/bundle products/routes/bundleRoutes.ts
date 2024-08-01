// src/routes/discountRoutes.ts
import express from 'express';
import {
  createBundle,
  updateBundle,
  deleteBundle,
  getAllBundleProductSales,
  getBundleDetails,
} from '../controllers/index';
import {
  authenticateSeller,
  authorizeSeller,
} from '../../../middleware/authMiddleware';

const router = express.Router();

router.post('/bundle', authenticateSeller, authorizeSeller, createBundle);
router.get(
  '/bundle',
  authenticateSeller,
  authorizeSeller,
  getAllBundleProductSales
);
router.get(
  '/bundle-details',
  authenticateSeller,
  authorizeSeller,
  getBundleDetails
);

router.put('/bundle', authenticateSeller, authorizeSeller, updateBundle);
router.delete('/bundle', authenticateSeller, authorizeSeller, deleteBundle);

export default router;
