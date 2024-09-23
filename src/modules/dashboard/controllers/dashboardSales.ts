import { Request, Response } from 'express';
import moment from 'moment';
import Order from '../../../models/orderModel';
import Product from '../../../models/productModel';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getSellerSalesAnalytics = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const {
      period,
      startDate: queryStartDate,
      endDate: queryEndDate,
    } = req.query;
    const sellerId = req.user?.userId;

    if (!sellerId) {
      return res.status(400).json({ message: 'Seller ID is missing' });
    }

    let startDate: Date;
    let endDate = new Date(); // Default to current date and time
    const currentDate = new Date(); // Used for future date validation

    // Handle custom date range
    if (queryStartDate || queryEndDate) {
      // Validate that both startDate and endDate are provided
      if (!queryStartDate || !queryEndDate) {
        return res.status(400).json({
          message:
            'Both startDate and endDate must be provided for custom range',
        });
      }

      startDate = new Date(queryStartDate as string);
      endDate = new Date(queryEndDate as string);

      // Check if custom dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          message: 'Invalid date format. Please use a valid date string.',
        });
      }

      // Ensure that startDate is before endDate
      if (startDate > endDate) {
        return res.status(400).json({
          message: 'startDate cannot be after endDate',
        });
      }

      // Ensure startDate is not in the future
      if (startDate > currentDate) {
        return res.status(400).json({
          message: 'startDate cannot be in the future',
        });
      }

      // Ensure endDate is not in the future
      if (endDate > currentDate) {
        return res.status(400).json({
          message: 'endDate cannot be in the future',
        });
      }
    } else {
      // Determine the start date based on the specified period
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
        case 'yearly':
          startDate = moment().startOf('year').toDate();
          break;
        default:
          return res.status(400).json({ message: 'Invalid period specified' });
      }

      // Ensure startDate is not in the future for predefined periods
      if (startDate > currentDate) {
        return res.status(400).json({
          message: 'Start date cannot be in the future for the selected period',
        });
      }
    }

    console.log(`Start Date: ${startDate}`);
    console.log(`End Date: ${endDate}`);

    // Get aggregated data
    const [totalSales, totalProductsSold, topSellingProduct] =
      await Promise.all([
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          { $unwind: '$items' },
          {
            $lookup: {
              from: 'products',
              localField: 'items.productId',
              foreignField: '_id',
              as: 'productData',
            },
          },
          { $unwind: '$productData' },
          {
            $match: {
              'productData.sellerId': new mongoose.Types.ObjectId(sellerId),
            },
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$totalAmount' },
            },
          },
        ]).exec(),

        getTotalProductsSoldBySeller(sellerId, startDate, endDate),

        getTopSellingProductBySeller(sellerId, startDate, endDate),
      ]);

    res.status(200).json({
      totalSales: totalSales[0]?.totalSales || 0,
      totalProductsSold: totalProductsSold[0]?.totalQuantity || 0,
      topSellingProduct: topSellingProduct[0] || null,
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

const getTotalProductsSoldBySeller = async (
  sellerId: string,
  startDate: Date,
  endDate: Date
) => {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'productData',
      },
    },
    { $unwind: '$productData' },
    {
      $match: {
        'productData.sellerId': new mongoose.Types.ObjectId(sellerId),
      },
    },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$items.quantity' },
      },
    },
  ];

  // Execute each stage separately for debugging
  let intermediateResult = await Order.aggregate([pipeline[0]]).exec();
  console.log(
    'After $match stage:',
    JSON.stringify(intermediateResult, null, 2)
  );

  intermediateResult = await Order.aggregate([pipeline[0], pipeline[1]]).exec();
  console.log(
    'After $unwind stage:',
    JSON.stringify(intermediateResult, null, 2)
  );

  intermediateResult = await Order.aggregate([
    pipeline[0],
    pipeline[1],
    pipeline[2],
  ]).exec();
  console.log(
    'After $lookup stage:',
    JSON.stringify(intermediateResult, null, 2)
  );

  intermediateResult = await Order.aggregate([
    pipeline[0],
    pipeline[1],
    pipeline[2],
    pipeline[3],
  ]).exec();
  console.log(
    'After second $unwind stage:',
    JSON.stringify(intermediateResult, null, 2)
  );

  intermediateResult = await Order.aggregate([
    pipeline[0],
    pipeline[1],
    pipeline[2],
    pipeline[3],
    pipeline[4],
  ]).exec();
  console.log(
    'After second $match stage:',
    JSON.stringify(intermediateResult, null, 2)
  );

  intermediateResult = await Order.aggregate([
    pipeline[0],
    pipeline[1],
    pipeline[2],
    pipeline[3],
    pipeline[4],
    pipeline[5],
  ]).exec();
  console.log(
    'After $group stage:',
    JSON.stringify(intermediateResult, null, 2)
  );

  // Execute the entire pipeline
  const result = await Order.aggregate(pipeline).exec();
  console.log(
    `getTotalProductsSoldBySeller Result: ${JSON.stringify(result, null, 2)}`
  );

  return result;
};

const getTopSellingProductBySeller = async (
  sellerId: string,
  startDate: Date,
  endDate: Date
) => {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'productData',
      },
    },
    { $unwind: '$productData' },
    {
      $match: {
        'productData.sellerId': new mongoose.Types.ObjectId(sellerId),
      },
    },
    {
      $group: {
        _id: {
          productId: '$items.productId',
          productName: '$productData.name',
        },
        totalQuantity: { $sum: '$items.quantity' },
      },
    },
    {
      $sort: { totalQuantity: -1 },
    },
    { $limit: 1 },
    {
      $project: {
        _id: 0,
        productId: '$_id.productId',
        productName: '$_id.productName',
        totalQuantity: 1,
      },
    },
  ]).exec();

  console.log(`getTopSellingProductBySeller Result: ${JSON.stringify(result)}`);
  return result;
};
