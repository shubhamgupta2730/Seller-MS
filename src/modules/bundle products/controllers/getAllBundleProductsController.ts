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

  const {
    search,
    sortBy,
    sortOrder = 'asc',
    page = '1',
    limit = '5',
    showBlocked = 'false',
  } = req.query;

  const searchQuery = typeof search === 'string' ? search : '';
  const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt';
  const sortOrderValue = typeof sortOrder === 'string' ? sortOrder : 'asc';
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const showBlockedProducts = showBlocked === 'true';

  const filter: any = {
    'createdBy.id': new mongoose.Types.ObjectId(userId),
    'createdBy.role': 'seller',
    isActive: true,
    isDeleted: false,
  };

  if (showBlockedProducts) {
    filter.isBlocked = true;
  } else {
    filter.isBlocked = false;
  }

  if (searchQuery) {
    filter.name = { $regex: searchQuery, $options: 'i' };
  }

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
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          MRP: 1,
          sellingPrice: 1,
          discount: 1,
          isBlocked: 1,
          products: {
            $map: {
              input: '$products',
              as: 'product',
              in: {
                productId: '$$product.productId',
                quantity: '$$product.quantity',
                name: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$productDetails',
                        as: 'detail',
                        cond: { $eq: ['$$detail._id', '$$product.productId'] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
      { $sort: sortCriteria },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ];

    const bundles = await BundleProduct.aggregate(aggregationPipeline);

    const totalBundles = await BundleProduct.countDocuments(filter);

    if (!bundles.length) {
      return res
        .status(404)
        .json({ message: 'No bundles found for this seller' });
    }

    res.status(200).json({
      bundles: bundles.map((bundle: any) => ({
        _id: bundle._id,
        name: bundle.name,
        MRP: bundle.MRP,
        sellingPrice: bundle.sellingPrice,
        discount: bundle.discount,
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
