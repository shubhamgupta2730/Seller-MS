import express from 'express';
import {
  createProduct,
  getAllSellerProducts,
  getProductDetails,
  updateProduct,
  deleteProduct,
} from '../controllers/index';
import {
  authenticateSeller,
  authorizeSeller,
} from '../../../middleware/authMiddleware';

const router = express.Router();

router.post('/product', authenticateSeller, authorizeSeller, createProduct);
router.get(
  '/product',
  authenticateSeller,
  authorizeSeller,
  getAllSellerProducts
);
router.get(
  '/specific-product',
  authenticateSeller,
  authorizeSeller,
  getProductDetails
);
router.patch('/product', authenticateSeller, authorizeSeller, updateProduct);
router.delete('/product', authenticateSeller, authorizeSeller, deleteProduct);

export default router;
