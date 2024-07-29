import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product, BundleProduct } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const deleteProduct = async (req: CustomRequest, res: Response) => {
  const { productId } = req.query;
  const sellerId = req.user?.userId;

  console.log('Received request to delete product:', productId);
  console.log('Seller ID:', sellerId);

  if (
    typeof productId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    console.log('Invalid product ID format:', productId);
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  if (!sellerId) {
    console.log('Unauthorized request: Missing seller ID');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Convert productId to ObjectId
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const product = await Product.findOne({
      _id: productObjectId,
      sellerId: sellerId,
    });

    if (!product) {
      console.log('Product not found or unauthorized:', productId);
      return res
        .status(404)
        .json({ message: 'Product not found or unauthorized' });
    }

    console.log('Product found:', product);

    product.isActive = false;

    await product.save();

    console.log('Product deactivated:', productId);

    // Remove the product from bundles
    await BundleProduct.updateMany(
      { products: productObjectId },
      { $pull: { products: productObjectId } }
    );

    console.log('Product removed from bundles:', productId);

    res.status(200).json({
      message: 'Product deactivated successfully and removed from bundles',
    });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Failed to deactivate product', error });
  }
};
