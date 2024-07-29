import { Request, Response } from 'express';
import mongoose from 'mongoose';
import BundleProduct from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getAllBundleProductSales = async (
  req: CustomRequest,
  res: Response
) => {
  const sellerId = req.user?.userId;

  if (!sellerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Extract and cast query parameters
  const {
    search,
    sortBy,
    sortOrder = 'asc',
    page = '1',
    limit = '5',
  } = req.query;

  // Type cast and handle defaults
  const searchQuery = typeof search === 'string' ? search : '';
  const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt';
  const sortOrderValue = typeof sortOrder === 'string' ? sortOrder : 'asc';
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  // Create a filter object
  const filter: any = {
    sellerId: new mongoose.Types.ObjectId(sellerId),
    isActive: true,
  };

  // Add search filter if search query is provided
  if (searchQuery) {
    filter.name = { $regex: searchQuery, $options: 'i' };
  }

  // Determine the sorting criteria
  const sortCriteria: any = {};
  if (sortByField) {
    sortCriteria[sortByField] = sortOrderValue === 'desc' ? -1 : 1;
  }

  try {
    const aggregationPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          MRP: 1,
          sellingPrice: 1,
          discountPercentage: 1,
          'products.productId': 1,
          'products.quantity': 1,
          'productDetails.MRP': 1,
          sellerId: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: sortCriteria },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ];

    const bundles = await BundleProduct.aggregate(aggregationPipeline);

    // Get total count of bundles for pagination
    const totalBundles = await BundleProduct.countDocuments(filter);

    // Check if bundles are found
    if (!bundles.length) {
      return res
        .status(404)
        .json({ message: 'No bundles found for this seller' });
    }

    // Return the bundles with pagination info
    res.status(200).json({
      bundles,
      pagination: {
        total: totalBundles,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to retrieve bundle product sales', error });
  }
};
