import { Request, Response } from 'express';
import { Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const updateProduct = async (req: CustomRequest, res: Response) => {
  const { productId } = req.query;
  const { name, description, price, stock, bundleId, categoryId } = req.body;
  const sellerId = req.user?.userId;

  try {
    const product = await Product.findOneAndUpdate(
      { _id: productId ,sellerId},
      { name, description, price, stock, bundleId, categoryId },
      { new: true }
    );

    if (!product) {
      return res
        .status(404)
        .json({ message: 'Product not found or unauthorized' });
    }

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error });
  }
};
