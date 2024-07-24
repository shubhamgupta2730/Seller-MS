// src/controllers/discountController.ts
import { Request, Response } from 'express';
import Product from '../../../models/productModel';
import Discount from '../../../models/discountModel';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const addDiscount = async (req: CustomRequest, res: Response) => {
  const { productId, discountType, discountValue, startDate, endDate } = req.body;
  const sellerAuthId = req.user?.userId;

  try {

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerId.toString() !== sellerAuthId) {
      return res.status(403).json({ message: 'You do not own this product' });
    }

    const newDiscount = new Discount({
      productId,
      sellerAuthId,
      discountType,
      discountValue,
      startDate,
      endDate,
    });

  
    await newDiscount.save();

    product.discounts.push(newDiscount._id as mongoose.Types.ObjectId);
    await product.save();

    res.status(201).json({
      message: 'Discount added successfully',
      discount: newDiscount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add discount', error });
  }
};
