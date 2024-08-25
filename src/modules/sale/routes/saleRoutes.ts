import express from 'express';

import {
  authenticateSeller,
  authorizeSeller,
} from '../../../middleware/authMiddleware';
import { sellerAddProductsToSale } from '../controllers/addProductToSale';
import { removeSellerProductFromSale } from '../controllers/removeProductFromSale';
import { getSellerSale } from '../controllers/getSale';

const router = express.Router();

router.post(
  '/add-products',
  authenticateSeller,
  authorizeSeller,
  sellerAddProductsToSale
);
router.post(
  '/remove-products',
  authenticateSeller,
  authorizeSeller,
  removeSellerProductFromSale
);
router.get('/get-sale', authenticateSeller, authorizeSeller, getSellerSale);

export default router;
