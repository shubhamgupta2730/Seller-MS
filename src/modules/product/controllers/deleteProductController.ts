import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product, Bundle } from '../../../models/index';
import Category from '../../../models/categoryModel';
import Discount from '../../../models/discountModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const deleteProduct = async (req: CustomRequest, res: Response) => {
  const { productId } = req.query;
  const sellerId = req.user?.userId;

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
    const productObjectId = new mongoose.Types.ObjectId(productId);

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

    product.isDeleted = true;
    await product.save();

    const result = await Bundle.updateMany(
      { 'products.productId': productObjectId },
      { $pull: { products: { productId: productObjectId } } }
    );

    const bundles = await Bundle.find({
      'products.productId': productObjectId,
    });
    for (const bundle of bundles) {
      let totalMRP = 0;

      // Recalculate total MRP
      for (const product of bundle.products) {
        const prod = await Product.findById(product.productId);
        if (prod && prod.MRP) {
          totalMRP += prod.MRP;
        }
      }

      // Apply the discount to calculate the new selling price
      let sellingPrice = totalMRP;
      if (bundle.discount) {
        sellingPrice = totalMRP - totalMRP * (bundle.discount / 100);
      }

      bundle.MRP = totalMRP;
      bundle.sellingPrice = sellingPrice;

      await bundle.save();
    }

    if (product.categoryId) {
      await Category.updateOne(
        { _id: product.categoryId },
        { $pull: { productIds: productObjectId } }
      );
    }

    // Remove the productID from the Discount model
    await Discount.updateMany(
      { productIds: productId },
      { $pull: { productIds: productId } }
    );

    res.status(200).json({
      message: 'Product removed successfully',
    });
  } catch (error) {
    console.log('Error occurred:', error);
    res.status(500).json({ message: 'Failed to delete product', error });
  }
};
