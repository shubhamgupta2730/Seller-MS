import express from 'express';
import sellerProfileRoutes from '../modules/sellerProfile/routes/sellerProfileRoute';
import productRoutes from '../modules/product/routes/productRoutes';
import bundleRoutes from '../modules/bundle products/routes/bundleRoutes';

const router = express.Router();

router.use('/sellerProfileRoute', sellerProfileRoutes);
router.use('/productRoute', productRoutes);
router.use('/bundleRoute', bundleRoutes);

export default router;
