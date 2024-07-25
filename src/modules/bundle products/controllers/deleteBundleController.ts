import { Request, Response } from 'express';
import { BundleProduct, Discount } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const deleteBundle = async (req: CustomRequest, res: Response) => {
  const { bundleId } = req.query;
  const sellerAuthId = req.user?.userId;

  if (!sellerAuthId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!bundleId || typeof bundleId !== 'string') {
    return res.status(400).json({ message: 'Invalid bundle ID' });
  }

  try {
  
    const bundle = await BundleProduct.findById(bundleId);

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }


    if (bundle.sellerAuthId.toString() !== sellerAuthId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to delete this bundle' });
    }

    // Find and delete associated discounts
    const result = await Discount.deleteMany({ bundleId: bundle._id });
    if (result.deletedCount === 0) {
      console.warn('No associated discounts found for this bundle');
    }

    // Delete the bundle
    await BundleProduct.deleteOne({ _id: bundleId });

    res.status(200).json({
      message: 'Bundle and associated discounts deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete bundle', error);
    res.status(500).json({ message: 'Failed to delete bundle', error });
  }
};
