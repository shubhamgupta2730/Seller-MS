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

  if (!productId) {
    console.log('Product ID is missing from the request');
    return res.status(400).json({ message: 'Product ID is required' });
  }

  if (!sellerId) {
    console.log('Seller ID is missing from the request');
    return res.status(400).json({ message: 'Seller ID is required' });
  }

  try {

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, sellerId },
      { name, description, price, stock, bundleId, categoryId },
      { new: true }
    );

    if (!updatedProduct) {
      console.log('Product not found or unauthorized');
      return res
        .status(404)
        .json({ message: 'Product not found or unauthorized' });
    }

    console.log('Product updated successfully');
    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Failed to update product', error });
  }
};
