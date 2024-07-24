// src/routes/index.ts
import express from 'express';
import sellerProfileRoutes from '../modules/sellerProfile/routes/sellerProfileRoute';
import productRoutes from '../modules/product/routes/productRoutes';

const router = express.Router();

// Namespace your routes
router.use('/sellerProfileRoute', sellerProfileRoutes);
router.use('/productRoute', productRoutes);

export default router;
