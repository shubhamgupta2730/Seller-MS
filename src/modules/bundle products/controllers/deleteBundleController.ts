import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bundle, Product } from '../../../models/index';

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
    // Find the bundle
    const bundle = await Bundle.findOne({_id: bundleId, isActive: true, isBlocked:false, isDeleted: false});
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if the current user is authorized to delete the bundle
    if (bundle.sellerId?.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to delete this bundle' });
    }

    // Remove the bundle ID from products associated with the bundle
    await Product.updateMany(
      { bundleId: new mongoose.Types.ObjectId(bundleId) },
      { $unset: { bundleId: '' } }
    );

    // Soft delete the bundle
    bundle.isDeleted = true;
    await bundle.save();

    res.status(200).json({
      message: 'Bundle deleted successfully.',
    });
  } catch (error) {
    console.error('Failed to delete bundle', error);
    res.status(500).json({ message: 'Failed to delete bundle', error });
  }
};
