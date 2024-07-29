import { Request, Response } from 'express';
import { Product } from '../../../models/index';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const updateProduct = async (req: CustomRequest, res: Response) => {
  const { productId } = req.query;
  const { name, description, MRP, discountPercentage, quantity, categoryId, bundleId } =
    req.body;
  const sellerId = req.user?.userId;

  if (
    typeof productId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  if (!sellerId) {
    console.log('Seller ID is missing from the request');
    return res.status(400).json({ message: 'Seller ID is required' });
  }

  try {
    // Calculate the selling price based on MRP and discountPercentage
    let sellingPrice = MRP;
    if (discountPercentage) {
      sellingPrice = MRP - MRP * (discountPercentage / 100);
    }

    // Update the product
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, sellerId: sellerId, isActive: true },
      {
        name,
        description,
        MRP,
        discountPercentage,
        sellingPrice,
        quantity,
        categoryId,
        bundleId,
      },
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
