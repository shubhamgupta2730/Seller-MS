import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../../../models/productModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getAllSellerProducts = async (
  req: CustomRequest,
  res: Response
) => {
  const sellerId = req.user?.userId;

  if (!sellerId) {
    console.log('Seller ID is missing from the request');
    return res.status(400).json({ message: 'Seller ID is missing' });
  }

  const {
    search = '',
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 5,
    category = '',
  } = req.query;

  // Convert page and limit to numbers
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  try {
    // Build the match stage
    const matchStage: any = {
      sellerId: new mongoose.Types.ObjectId(sellerId),
      isActive: true,
      isBlocked: false,
      isDeleted: false,
      name: { $regex: search, $options: 'i' }, // Search by name
    };

    // Add category match if provided
    if (category) {
      matchStage['category.name'] = { $regex: `^${category}$`, $options: 'i' }; // Exact match for category name
    }

    // Log the match stage for debugging
    console.log('Match Stage:', matchStage);

    // Execute the aggregation query
    const products = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: matchStage },
      {
        $project: {
          _id: 1, // Exclude the _id field
          name: 1,
          description: 1,
          MRP: 1,
          sellingPrice: 1,
          quantity: 1,
          discount: 1,
          category: '$category.name', // Include the category name
        },
      },
      { $sort: { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ]);

    if (!products.length) {
      console.log('No products found for this seller');
      return res
        .status(404)
        .json({ message: 'No products found for this seller' });
    }

    // Get total count of products for pagination
    const totalProducts = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: matchStage },
      {
        $count: 'total',
      },
    ]);

    const total = totalProducts[0]?.total || 0;

    res.status(200).json({
      products,
      pagination: {
        total: total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Failed to retrieve products', error });
  }
};
