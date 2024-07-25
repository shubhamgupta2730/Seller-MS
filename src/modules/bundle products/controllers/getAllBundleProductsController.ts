import { Request, Response } from 'express';
import Bundle from '../../../models/bundleProductModel';
import Discount from '../../../models/discountModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getAllBundleProductSales = async (
  req: CustomRequest,
  res: Response
) => {
  const sellerId = req.user?.userId;

  // Get query parameters for search, sorting, and pagination
  const { search, sortBy, sortOrder = 'asc', page = 1, limit = 10 } = req.query;

  // Create a filter object
  const filter: any = { sellerAuthId: sellerId };

  // Add search filter if search query is provided
  if (search) {
    filter.bundleName = { $regex: search, $options: 'i' }; // Case-insensitive search
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
    
    const bundles = await Bundle.find(filter)
      .populate('products', 'price') 
      .populate('discounts', 'discountType discountValue startDate endDate') 
      .sort(sortCriteria)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Check if bundles are found
    if (!bundles.length) {
      return res
        .status(404)
        .json({ message: 'No bundles found for this seller' });
    }

    // Process each bundle to calculate the final price
    const bundlesWithFinalPrices = await Promise.all(
      bundles.map(async (bundle) => {
        // Get the current date
        const now = new Date();

        // Filter out discounts that are not active
        const activeDiscounts = await Discount.find({
          _id: { $in: bundle.discounts },
          startDate: { $lte: now },
          endDate: { $gte: now },
        });

        // Calculate the total price of the bundle
        let totalPrice = 0;
        for (const product of bundle.products) {
          totalPrice += product.price;
        }

        // Apply each active discount to the total price
        for (const discount of activeDiscounts) {
          if (discount.discountType === 'percentage') {
            totalPrice -= (totalPrice * discount.discountValue) / 100;
          } else if (discount.discountType === 'fixed') {
            totalPrice -= discount.discountValue;
          }
        }

        // Return the bundle with the calculated final price
        return {
          ...bundle.toObject(),
          finalPrice: totalPrice,
        };
      })
    );

    // Get total count of bundles for pagination
    const totalBundles = await Bundle.countDocuments(filter);

    // Return the bundles with pagination info
    res.status(200).json({
      bundlesWithFinalPrices,
      pagination: {
        total: totalBundles,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to retrieve bundle product sales', error });
  }
};
