import { Request, Response } from 'express';
import { Product } from '../../../models/index';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const createProduct = async (req: CustomRequest, res: Response) => {
  const { name, description, MRP, discountPercentage, quantity, categoryId } =
    req.body;
  const sellerId = req.user?.userId;

  if (!sellerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (
    !name ||
    !MRP ||
    discountPercentage === undefined ||
    quantity === undefined
  ) {
    return res.status(400).json({
      message:
        'Missing required fields: name, MRP, discountPercentage, and quantity are required',
    });
  }

  // Ensure MRP, discountPercentage, and quantity are positive numbers
  if (
    MRP <= 0 ||
    discountPercentage < 0 ||
    discountPercentage > 100 ||
    quantity < 0
  ) {
    return res.status(400).json({
      message:
        'Invalid MRP, discountPercentage, or quantity value: MRP must be greater than 0, discountPercentage must be between 0 and 100, and quantity cannot be negative',
    });
  }

  //  categoryId is a valid MongoDB ObjectID if provided
  if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ message: 'Invalid categoryId' });
  }

  try {
    //  selling price based on discount percentage
    let sellingPrice = MRP;
    if (discountPercentage) {
      sellingPrice = MRP - MRP * (discountPercentage / 100);
    }

    const newProduct = new Product({
      sellerId,
      name,
      description,
      MRP,
      sellingPrice,
      quantity,
      discountPercentage,
      categoryId: categoryId,
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
