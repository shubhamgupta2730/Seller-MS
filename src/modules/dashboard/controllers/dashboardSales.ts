import { Request, Response } from 'express';
import Order from '../../../models/orderModel';
import Product from '../../../models/productModel';
import Category from '../../../models/categoryModel';
import moment from 'moment';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

// Helper function to get total sales for a seller
const getTotalSalesForSeller = async (
  sellerId: string,
  startDate: Date,
  endDate: Date
) => {
  console.log(
    `Fetching total sales for sellerId: ${sellerId}, startDate: ${startDate}, endDate: ${endDate}`
  );

  const result = await Order.aggregate([
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: '$productInfo' },
    {
      $match: {
        'productInfo.sellerId': sellerId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$items.price' },
      },
    },
  ]);

  console.log('Total sales result:', result);
  return result;
};

// Helper function to get top-selling product for a seller
const getTopSellingProductForSeller = async (
  sellerId: string,
  startDate: Date,
  endDate: Date
) => {
  console.log(
    `Fetching top-selling product for sellerId: ${sellerId}, startDate: ${startDate}, endDate: ${endDate}`
  );

  const result = await Product.aggregate([
    {
      $match: { sellerId },
    },
    {
      $lookup: {
        from: 'orders',
        let: { productId: '$_id' },
        pipeline: [
          { $unwind: '$items' },
          {
            $match: {
              $expr: { $eq: ['$items.productId', '$$productId'] },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: '$items.productId',
              totalQuantity: { $sum: '$items.quantity' },
            },
          },
        ],
        as: 'orderData',
      },
    },
    { $unwind: '$orderData' },
    { $sort: { 'orderData.totalQuantity': -1 } },
    { $limit: 1 },
    { $project: { name: 1, totalQuantity: '$orderData.totalQuantity' } },
  ]);

  console.log('Top-selling product result:', result);
  return result;
};

// Helper function to get top-selling category for a seller
const getTopSellingCategoryForSeller = async (
  sellerId: string,
  startDate: Date,
  endDate: Date
) => {
  console.log(
    `Fetching top-selling category for sellerId: ${sellerId}, startDate: ${startDate}, endDate: ${endDate}`
  );

  const result = await Category.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'categoryId',
        as: 'products',
      },
    },
    { $unwind: '$products' },
    {
      $match: { 'products.sellerId': sellerId },
    },
    {
      $lookup: {
        from: 'orders',
        let: { productId: '$products._id' },
        pipeline: [
          { $unwind: '$items' },
          {
            $match: {
              $expr: { $eq: ['$items.productId', '$$productId'] },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: '$items.productId',
              totalSales: { $sum: '$items.price' },
            },
          },
        ],
        as: 'orderData',
      },
    },
    { $unwind: '$orderData' },
    {
      $group: {
        _id: '$_id',
        categoryName: { $first: '$name' },
        totalSales: { $sum: '$orderData.totalSales' },
      },
    },
    { $sort: { totalSales: -1 } },
    { $limit: 1 },
  ]);

  console.log('Top-selling category result:', result);
  return result;
};

// Seller Sales Dashboard API
export const getSellerSalesDashboard = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { period } = req.query;
    const sellerId = req.user?.userId; // Assuming sellerId is retrieved from req.user after authentication

    if (!sellerId) {
      return res.status(400).json({ message: 'Seller ID is required' });
    }

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'daily':
        startDate = moment().startOf('day').toDate();
        break;
      case 'weekly':
        startDate = moment().startOf('week').toDate();
        break;
      case 'monthly':
        startDate = moment().startOf('month').toDate();
        break;
      default:
        return res.status(400).json({ message: 'Invalid period specified' });
    }

    const [totalSales, topSellingProduct, topSellingCategory] =
      await Promise.all([
        getTotalSalesForSeller(sellerId, startDate, endDate),
        getTopSellingProductForSeller(sellerId, startDate, endDate),
        getTopSellingCategoryForSeller(sellerId, startDate, endDate),
      ]);

    console.log('Total sales:', totalSales);
    console.log('Top-selling product:', topSellingProduct);
    console.log('Top-selling category:', topSellingCategory);

    res.status(200).json({
      totalSales: totalSales[0]?.totalSales || 0,
      topSellingProduct: topSellingProduct[0] || null,
      topSellingCategory: topSellingCategory[0] || null,
    });
  } catch (error) {
    console.error('Error in getSellerSalesDashboard:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
