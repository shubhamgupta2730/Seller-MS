import express from 'express';
import sellerProfileRoutes from '../modules/sellerProfile/routes/sellerProfileRoute';
import productRoutes from '../modules/product/routes/productRoutes';
import bundleRoutes from '../modules/bundle products/routes/bundleRoutes';
import categoryRoutes from '../modules/category/routes/categoryRoute';
import saleRoutes from '../modules/sale/routes/saleRoutes';

const router = express.Router();

router.use('/sellerProfileRoute', sellerProfileRoutes);
router.use('/productRoute', productRoutes);
router.use('/bundleRoute', bundleRoutes);
router.use('/categoryRoute', categoryRoutes);
router.use('/saleRoute', saleRoutes);

export default router;
