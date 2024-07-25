import { Request, Response } from 'express';
import { Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getProductDetails = async (req: CustomRequest, res: Response) => {
  const { productId } = req.query;
  const sellerAuthId = req.user?.userId;


  if (!productId) {
    console.log('Product ID is missing from the request');
    return res.status(400).json({ message: 'Product ID is required' });
  }

  if (!sellerAuthId) {
    console.log('Seller ID is missing from the request');
    return res.status(400).json({ message: 'Seller ID is missing' });
  }

  console.log(`Seller ID: ${sellerAuthId}`);
  console.log(`Product ID: ${productId}`);

  try {

    const product = await Product.findById(productId).populate({
      path: 'discounts',
      select: 'discountType discountValue startDate endDate',
    });

 
    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ message: 'Product not found' });
    }


    if (product.sellerAuthId.toString() !== sellerAuthId) {
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
