import { Router } from 'express';
import { getSellerSalesDashboard } from '../controllers/dashboardSales';
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
  getSellerSalesDashboard
);

export default router;
