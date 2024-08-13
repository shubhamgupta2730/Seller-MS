import { Request, Response } from 'express';
import mongoose from 'mongoose';
import BundleProduct from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'seller' | 'admin';
  };
}

export const getAllBundleProductSales = async (
  req: CustomRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || userRole !== 'seller') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Extract and cast query parameters
  const {
    search,
    sortBy,
    sortOrder = 'asc',
    page = '1',
    limit = '5',
    showBlocked = 'false', // Default to 'false'
  } = req.query;

  // Type cast and handle defaults
  const searchQuery = typeof search === 'string' ? search : '';
  const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt';
  const sortOrderValue = typeof sortOrder === 'string' ? sortOrder : 'asc';
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const showBlockedProducts = showBlocked === 'true';

  // Create a filter object
  const filter: any = {
    'createdBy.id': new mongoose.Types.ObjectId(userId),
    'createdBy.role': 'seller',
    isActive: true,
    isDeleted: false,
  };

  // Adjust the filter based on showBlocked parameter
  if (showBlockedProducts) {
    filter.isBlocked = true;
  } else {
    filter.isBlocked = false;
  }

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
        $match: {
          'productDetails.isDeleted': false,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          MRP: 1,
          sellingPrice: 1,
          discount: 1,
          isBlocked: 1, // Include isBlocked in the projection
          products: {
            productId: 1,
            quantity: 1,
            name: '$productDetails.name',
            MRP: '$productDetails.MRP',
            sellingPrice: '$productDetails.sellingPrice',
          },
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
      bundles: bundles.map((bundle: any) => ({
        _id: bundle._id,
        name: bundle.name,
        description: bundle.description,
        MRP: bundle.MRP,
        sellingPrice: bundle.sellingPrice,
        discount: bundle.discount,
        isBlocked: bundle.isBlocked,
        products: bundle.products.map((product: any) => ({
          productId: product.productId,
          quantity: product.quantity,
          name: product.name,
          MRP: product.MRP,
          sellingPrice: product.sellingPrice,
        })),
      })),
      pagination: {
        total: totalBundles,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve bundle product sales',
      error,
    });
  }
};
