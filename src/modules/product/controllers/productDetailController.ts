import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../../../models/index';
import User from '../../../models/userModel';
import Review from '../../../models/reviewModel';
interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getProductDetails = async (req: CustomRequest, res: Response) => {
  const { productId } = req.query;
  const sellerId = req.user?.userId;

  if (!productId) {
    console.log('Product ID is missing from the request');
    return res.status(400).json({ message: 'Product ID is required' });
  }

  if (!sellerId) {
    console.log('Seller ID is missing from the request');
    return res.status(400).json({ message: 'Seller ID is required' });
  }

  if (
    typeof productId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    const productDetails = await Product.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(productId),
          sellerId: new mongoose.Types.ObjectId(sellerId),
          isActive: true,
          isBlocked: false,
          isDeleted: false,
        },
      },
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
      {
        $lookup: {
          from: 'bundles',
          localField: 'bundleIds', // Changed to 'bundleIds'
          foreignField: '_id',
          as: 'bundles',
        },
      },
      {
        $lookup: {
          from: 'reviews',
          let: { product_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$product_id'] },
                    { $ne: ['$isDeleted', true] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'reviewer',
              },
            },
            {
              $unwind: {
                path: '$reviewer',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                review: 1,
                rating: 1,
                images: 1,
                reviewerName: {
                  $concat: ['$reviewer.firstName', ' ', '$reviewer.lastName'],
                },
              },
            },
          ],
          as: 'reviews',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          images: 1, 
          description: 1,
          MRP: 1,
          sellingPrice: 1,
          quantity: 1,
          discount: 1,
          sellerName: {
            $concat: ['$seller.firstName', ' ', '$seller.lastName'],
          },
          categoryId: '$category._id',
          category: '$category.name',
          bundles: {
            $map: {
              input: '$bundles',
              as: 'bundle',
              in: {
                _id: '$$bundle._id',
                name: '$$bundle.name',
              },
            },
          },
          reviews: 1, // Include reviews in the response
        },
      },
    ]);

    if (!productDetails.length) {
      console.log('Product not found or unauthorized');
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product found and access authorized');
    res.status(200).json({ product: productDetails[0] });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Failed to retrieve product', error });
  }
};
