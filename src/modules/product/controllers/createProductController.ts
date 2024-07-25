import { Request, Response } from 'express';
import { Product } from '../../../models/index';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const createProduct = async (req: CustomRequest, res: Response) => {
  const { name, description, price, stock, bundleId, categoryId } = req.body;
  const sellerId = req.user?.userId;

  if (!sellerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }


  if (!name || !price || !stock) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Ensure price and stock are positive numbers
  if (price <= 0 || stock < 0) {
    return res.status(400).json({ message: 'Invalid price or stock value' });
  }

  // Ensure bundleId and categoryId are valid MongoDB ObjectIDs if provided
  if (bundleId && !mongoose.Types.ObjectId.isValid(bundleId)) {
    return res.status(400).json({ message: 'Invalid bundleId' });
  }

  if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ message: 'Invalid categoryId' });
  }

  try {
    const newProduct = new Product({
      sellerId,
      name,
      description,
      price,
      stock,
      bundleId,
      categoryId,
    });

    await newProduct.save();

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error });
  }
};
