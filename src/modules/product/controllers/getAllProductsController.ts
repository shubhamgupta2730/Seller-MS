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

  const {
    search = '',
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 5,
  } = req.query;

  // Convert page and limit to numbers
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  try {
    // Build the query object
    const query = {
      sellerId: sellerId,
      isActive: true,
      name: { $regex: search, $options: 'i' }
    };

    // Log the query for debugging
    console.log('Query:', query);

    // Execute the query
    const products = await Product.find(query)
      .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('name description MRP discountAmount sellingPrice quantity categoryId sellerId');

    if (!products.length) {
      console.log('No products found for this seller');
      return res
        .status(404)
        .json({ message: 'No products found for this seller' });
    }

    // Get total count of products for pagination
    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      products,
      pagination: {
        total: totalProducts,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Failed to retrieve products', error });
  }
};
