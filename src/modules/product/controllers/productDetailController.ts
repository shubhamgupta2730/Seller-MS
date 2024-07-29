import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../../../models/index';

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
    return res.status(400).json({ message: 'Seller ID is missing' });
  }

  if (
    typeof productId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    const product = await Product.findOne({
      _id: productId,
      sellerId: sellerId,
      isActive: true,
    });

    if (!product) {
      console.log('Product not found or unauthorized');
      return res
        .status(404)
        .json({ message: 'Product not found or unauthorized' });
    }

    console.log('Product found and access authorized');
    res.status(200).json({ product });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Failed to retrieve product', error });
  }
};
