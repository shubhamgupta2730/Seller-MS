// src/routes/index.ts
import express from 'express';
import sellerProfileRoutes from '../modules/sellerProfile/routes/sellerProfileRoute';
import productRoutes from '../modules/product/routes/productRoutes';
import discountRoutes from '../modules/discount/routes/discountRoutes';

const router = express.Router();

router.use('/sellerProfileRoute', sellerProfileRoutes);
router.use('/productRoute', productRoutes);
router.use('/discountRoute', discountRoutes);

export default router;
