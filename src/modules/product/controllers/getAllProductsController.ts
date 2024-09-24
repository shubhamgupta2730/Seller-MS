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
    showBlocked = 'false',
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const showBlockedProducts = showBlocked === 'true';

  try {
    const matchStage: any = {
      sellerId: new mongoose.Types.ObjectId(sellerId),
      isActive: true,
      isDeleted: false,
      isBlocked: showBlockedProducts,
      name: { $regex: search, $options: 'i' },
    };

    if (category) {
      matchStage['category.name'] = { $regex: `^${category}$`, $options: 'i' }; // Exact match for category name
    }

    console.log('Match Stage:', matchStage);

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
      {
        $lookup: {
          from: 'users',
          localField: 'sellerId',
          foreignField: '_id',
          as: 'seller',
        },
      },
      {
        $unwind: {
          path: '$seller',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: matchStage },
      {
        $project: {
          _id: 1,
          name: 1,
          images:1,
          // description: 1,
          MRP: 1,
          sellingPrice: 1,
          // quantity: 1,
          discount: 1,
          categoryId: '$category._id',
          category: '$category.name',
          // sellerName: {
          //   $concat: ['$seller.firstName', ' ', '$seller.lastName']
          // }
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
