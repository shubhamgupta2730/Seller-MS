import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product, Discount } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const deleteProduct = async (req: CustomRequest, res: Response) => {
  const { productId } = req.query;
  const sellerId = req.user?.userId;

  // Validate the productId format
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    // Find the product by ID and ensure it belongs to the seller
    const product = await Product.findOne({ _id: productId, sellerId });

    if (!product) {
      return res
        .status(404)
        .json({ message: 'Product not found or unauthorized' });
    }

 
    await Discount.deleteMany({ productId: product._id });


    await Product.deleteOne({ _id: productId });

    res.status(200).json({
      message: 'Product and associated discounts deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error });
  }
};
