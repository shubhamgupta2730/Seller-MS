import { Router } from 'express';
import { createSellerProfile } from '../controllers/sellerProfileController';
import {
  authenticateSeller,
  authorizeSeller,
} from '../../../middleware/authMiddleware';

const router = Router();

// Route to create a seller profile
router.post(
  '/sellerProfile',
  authenticateSeller,
  authorizeSeller,
  createSellerProfile
);

export default router;
