import { Request, Response } from 'express';
import { BundleProduct, Product } from '../../../models/index';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getBundleDetails = async (req: CustomRequest, res: Response) => {
  const { bundleId } = req.query;
  const sellerId = req.user?.userId;

  if (!sellerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (
    !bundleId ||
    typeof bundleId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(bundleId)
  ) {
    return res.status(400).json({ message: 'Invalid bundle ID' });
  }

  try {
    // Find the bundle by ID and ensure the seller owns it
    const bundle = await BundleProduct.findOne({
      _id: bundleId,
      sellerId: new mongoose.Types.ObjectId(sellerId),
    }).populate('products.productId', 'name MRP sellingPrice');

    if (!bundle) {
      return res
        .status(404)
        .json({ message: 'Bundle not found or unauthorized' });
    }

    res.status(200).json({
      message: 'Bundle retrieved successfully',
      bundle,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to retrieve bundle details', error });
  }
};
