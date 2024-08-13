import { Router } from 'express';
import { createSellerProfile } from '../controllers/sellerProfileController';
import { viewSellerProfile } from '../controllers/viewSellerProfile';
import { updateSellerProfile } from '../controllers/updateSellerProfile';
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

router.get(
  '/getSellerProfile',
  authenticateSeller,
  authorizeSeller,
  viewSellerProfile
);

router.patch(
  '/update-profile',
  authenticateSeller,
  authorizeSeller,
  updateSellerProfile
);

export default router;
