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

  // Check if sellerId is provided
  if (!sellerId) {
    console.log('Seller ID is missing from the request');
    return res.status(400).json({ message: 'Seller ID is missing' });
  }

  // Get query parameters for search, sorting, and pagination
  const { search, sortBy, sortOrder = 'asc', page = 1, limit = 10 } = req.query;

  // Create a filter object
  const filter: any = { sellerId };

  // Add search filter if search query is provided
  if (search) {
    filter.name = { $regex: search, $options: 'i' }; // Case-insensitive search
  }

  // Determine the sorting criteria
  const sortCriteria: any = {};
  if (sortBy) {
    sortCriteria[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }

  // Convert page and limit to numbers
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  try {
    // Fetch products for the seller with filters, sorting, and pagination
    const products = await Product.find(filter)
      .populate({
        path: 'discounts',
        select: 'discountType discountValue startDate endDate',
      })
      .sort(sortCriteria)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (!products.length) {
      console.log('No products found for this seller');
      return res
        .status(404)
        .json({ message: 'No products found for this seller' });
    }

    // Get total count of products for pagination
    const totalProducts = await Product.countDocuments(filter);

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
