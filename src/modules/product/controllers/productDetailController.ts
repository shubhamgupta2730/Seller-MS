import { Request, Response } from 'express';
import { Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getProductDetails = async (req: CustomRequest, res: Response) => {
  const { productId } = req.query;
  const sellerId = req.user?.userId;

  console.log(`Seller ID: ${sellerId}`);

  try {
    const product = await Product.findById(productId).populate({
      path: 'discounts',
      select: 'discountType discountValue startDate endDate',
    });

    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerId.toString() !== sellerId) {
      console.log('Unauthorized access attempt');
      return res
        .status(403)
        .json({ message: 'You are not authorized to view this product' });
    }

    console.log('Product found and access authorized');
    res.status(200).json({ product });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Failed to retrieve product', error });
  }
};
