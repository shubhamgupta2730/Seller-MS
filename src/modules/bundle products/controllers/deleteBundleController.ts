import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BundleProduct, Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const deleteBundle = async (req: CustomRequest, res: Response) => {
  const { bundleId } = req.query;
  const sellerId = req.user?.userId;

  if (!sellerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (
    typeof bundleId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(bundleId)
  ) {
    return res.status(400).json({ message: 'Invalid bundle ID format' });
  }

  try {
    const bundle = await BundleProduct.findById(bundleId);

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    if (bundle.sellerId.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to delete this bundle' });
    }

    // Remove the bundle ID from products associated with the bundle
    await Product.updateMany(
      { bundleId: bundle._id },
      { $unset: { bundleId: 1 } }
    );
    // Soft delete the bundle
    bundle.isActive = false;
    await bundle.save();

    res.status(200).json({
      message: 'Bundle deleted successfully.',
    });
  } catch (error) {
    console.error('Failed to delete bundle', error);
    res.status(500).json({ message: 'Failed to delete bundle', error });
  }
};
