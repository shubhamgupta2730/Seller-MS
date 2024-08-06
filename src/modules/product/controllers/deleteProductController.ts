import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product, Bundle } from '../../../models/index';

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

  // Validate productId format
  if (
    typeof productId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    console.log('Invalid product ID format:', productId);
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  // Validate sellerId
  if (!sellerId) {
    console.log('Unauthorized request: Missing seller ID');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Convert productId to ObjectId
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Find the product by ID and sellerId
    const product = await Product.findOne({
      _id: productObjectId,
      sellerId: sellerId,
      isDeleted: false,
    });

    if (!product) {
      console.log('Product not found or unauthorized:', productId);
      return res
        .status(404)
        .json({ message: 'Product not found or unauthorized' });
    }

    console.log('Product found:', product);

    // Mark product as deleted
    product.isDeleted = true;
    await product.save();
    console.log('Product marked as deleted:', productId);

    // Remove the product from bundles
    const result = await Bundle.updateMany(
      { 'products.productId': productObjectId },
      { $pull: { products: { productId: productObjectId } } }
    );

    console.log('Update result:', result);
    console.log('Product removed from bundles:', productId);

    // Recalculate the total price and selling price for affected bundles
    const bundles = await Bundle.find({
      'products.productId': productObjectId,
    });
    for (const bundle of bundles) {
      let totalMRP = 0;

      // Recalculate total MRP
      for (const product of bundle.products) {
        const prod = await Product.findById(product.productId);
        if (prod && prod.MRP) {
          totalMRP += prod.MRP * product.quantity;
        }
      }

      // Apply the discount to calculate the new selling price
      let sellingPrice = totalMRP;
      if (bundle.discount) {
        sellingPrice = totalMRP - totalMRP * (bundle.discount / 100);
      }

      // Update bundle with new prices
      bundle.MRP = totalMRP;
      bundle.sellingPrice = sellingPrice;

      await bundle.save();
      console.log(`Bundle ${bundle._id} updated with new prices.`);
    }

    res.status(200).json({
      message:
        'Product marked as deleted successfully and removed from bundles',
    });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Failed to delete product', error });
  }
};
