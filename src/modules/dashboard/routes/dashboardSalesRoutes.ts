import { Router } from 'express';
import { getSellerSalesAnalytics } from '../controllers/dashboardSales';
import {
  authenticateSeller,
  authorizeSeller,
} from '../../../middleware/authMiddleware';

const router = Router();

// Route to create a seller profile
router.get(
  '/get-total-sales',
  authenticateSeller,
  authorizeSeller,
  getSellerSalesAnalytics
);

export default router;
