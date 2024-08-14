import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bundle, Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const removeProductFromBundle = async (req: CustomRequest, res: Response) => {
  const { bundleId } = req.query;
  const { productId }: { productId: string } = req.body;
  const sellerId = req.user?.userId;

  if (!sellerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (
    !bundleId ||
    typeof bundleId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(bundleId)
  ) {
    return res.status(400).json({ message: 'Invalid bundle ID format' });
  }

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    // Find the existing bundle
    const bundle = await Bundle.findOne({
      _id: bundleId,
      isActive: true,
      isBlocked: false,
      isDeleted: false,
    });
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    if (bundle.sellerId?.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to update this bundle' });
    }

    // Check if the product exists in the bundle
    const productIndex = bundle.products.findIndex(
      (p) => p.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in bundle' });
    }

    // Remove the product from the bundle
    bundle.products.splice(productIndex, 1);

    // Recalculate total MRP and selling price
    let totalMRP = 0;
    const productPriceMap: { [key: string]: number } = {};
    const productNameMap: { [key: string]: string } = {};

    // Find all remaining products to calculate MRP and get names
    for (const p of bundle.products) {
      const prod = await Product.findById(p.productId);
      if (prod) {
        productPriceMap[p.productId.toString()] = prod.MRP;
        productNameMap[p.productId.toString()] = prod.name;
        totalMRP += prod.MRP;
      }
    }

    // Update the bundle's pricing
    let sellingPrice = totalMRP;
    if (bundle.discount !== undefined) {
      sellingPrice = totalMRP - (totalMRP * bundle.discount) / 100;
    }

    bundle.MRP = totalMRP;
    bundle.sellingPrice = sellingPrice;

    await bundle.save();

    // Update the product to remove the bundle ID reference
    await Product.updateMany(
      { _id: productId },
      { $pull: { bundleIds: new mongoose.Types.ObjectId(bundleId) } } // Use $pull to remove bundleId from array
    );

    const response = {
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      MRP: bundle.MRP,
      sellingPrice: bundle.sellingPrice,
      discount: bundle.discount,
      products: bundle.products.map((p) => ({
        productId: p.productId.toString(),
        productName: productNameMap[p.productId.toString()] || 'Unknown Product',
      })),
    };

    res.status(200).json({ message: 'Product removed successfully', bundle: response });
  } catch (error) {
    console.error('Failed to remove product from bundle', error);
    res.status(500).json({ message: 'Failed to remove product from bundle', error });
  }
};
