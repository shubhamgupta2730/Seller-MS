import { Request, Response } from 'express';
import Product from '../../../models/productModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getAllSellerProducts = async (
  req: CustomRequest,
  res: Response
) => {
  const sellerId = req.user?.userId;

  if (!sellerId) {
    console.log('Seller ID is missing from the request');
    return res.status(400).json({ message: 'Seller ID is missing' });
  }

  try {
    const products = await Product.find({ sellerId }) .populate({
      path: 'discounts',
      select: 'discountType discountValue startDate endDate', 
    });

    if (!products.length) {
      console.log('No products found for this seller');
      return res
        .status(404)
        .json({ message: 'No products found for this seller' });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Failed to retrieve products', error });
  }
};
