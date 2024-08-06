import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../../../models/index';
import Category from '../../../models/categoryModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const updateProduct = async (req: CustomRequest, res: Response) => {
  const { productId } = req.query;
  const { name, description, MRP, discount, quantity, categoryId } = req.body;
  const sellerId = req.user?.userId;

  // Validate productId format
  if (
    typeof productId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  // Validate sellerId
  if (!sellerId) {
    return res.status(400).json({ message: 'Seller ID is required' });
  }

  // Validate required fields
  if (MRP === undefined || quantity === undefined) {
    return res.status(400).json({
      message: 'Missing required fields: MRP and quantity are required',
    });
  }

  // Validate MRP and quantity values
  if (typeof MRP !== 'number' || MRP <= 0) {
    return res.status(400).json({
      message: 'Invalid MRP: MRP must be a positive number',
    });
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({
      message: 'Invalid quantity: Quantity must be a non-negative number',
    });
  }

  // Validate discount if provided
  if (
    discount !== undefined &&
    (typeof discount !== 'number' || discount < 0 || discount > 100)
  ) {
    return res.status(400).json({
      message: 'Invalid discount: Discount must be a number between 0 and 100',
    });
  }

  // Validate categoryId if provided
  if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID format' });
  }

  try {
    // If categoryId is provided, check if the category exists and is active
    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        isActive: true,
      });
      if (!category) {
        return res
          .status(400)
          .json({ message: 'Category does not exist or is not active' });
      }
    }

    // Calculate selling price based on MRP and discount
    let sellingPrice = MRP;
    if (discount !== undefined) {
      sellingPrice = MRP - MRP * (discount / 100);
    }

    // Update the product
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, sellerId: sellerId, isActive: true },
      {
        $set: {
          name,
          description,
          MRP,
          discount,
          sellingPrice,
          quantity,
          categoryId: categoryId || null,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ message: 'Product not found or not active' });
    }

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error });
  }
};
