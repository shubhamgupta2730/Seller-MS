import { getCategoryById } from '../controllers/getCategory';
import { getAllCategories } from '../controllers/getAllCategory';
import express from 'express';
import {
  authenticateSeller,
  authorizeSeller,
} from '../../../middleware/authMiddleware';
const router = express.Router();

router.get(
  '/get-category',
  authenticateSeller,
  authorizeSeller,
  getCategoryById
);
router.get(
  '/get-all-categories',
  authenticateSeller,
  authorizeSeller,
  getAllCategories
);

export default router;
