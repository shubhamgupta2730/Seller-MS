import { Request, Response } from 'express';
import { BundleProduct, Product } from '../../../models/index';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

interface ProductInfo {
  productId: string;
  quantity: number;
}

export const updateBundle = async (req: CustomRequest, res: Response) => {
  const { bundleId } = req.query;
  const { name, description, products, discount } = req.body;
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
    // Find the existing bundle
    const bundle = await BundleProduct.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    if (bundle.sellerId?.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to update this bundle' });
    }

    // Track old product IDs
    const oldProductIds = bundle.products.map((p) => p.productId.toString());

    // Validate and update products in the bundle
    if (products && Array.isArray(products)) {
      // Extract product IDs from the new products array
      const productIds = products.map(
        (product: ProductInfo) => product.productId
      );

      // Ensure the seller owns all the products and they are active
      const ownedProducts = await Product.find({
        _id: { $in: productIds },
        sellerId: new mongoose.Types.ObjectId(sellerId),
        isActive: true,
      });

      if (ownedProducts.length !== productIds.length) {
        return res.status(403).json({
          message:
            'Unauthorized to update one or more products or products are not active',
        });
      }

      // Calculate the total MRP for the updated bundle
      let totalMRP = 0;
      const productPriceMap: { [key: string]: number } = {};

      // Store prices of owned products
      ownedProducts.forEach((product) => {
        const productId = (product._id as mongoose.Types.ObjectId).toString();
        productPriceMap[productId] = product.MRP;
      });

      // Calculate total MRP and validate quantities
      for (const productInfo of products) {
        const productId = productInfo.productId;
        const quantity = productInfo.quantity;

        if (!productPriceMap[productId]) {
          return res
            .status(404)
            .json({ message: `Product with ID ${productId} not found` });
        }

        // Add to total MRP
        totalMRP += productPriceMap[productId] * quantity;
      }

      // Calculate selling price based on discount percentage
      let sellingPrice = totalMRP;
      if (discount) {
        sellingPrice = totalMRP - totalMRP * (discount / 100);
      }

      // Update the bundle's product, price, and discount details
      bundle.products = products.map((p) => ({
        productId: new mongoose.Types.ObjectId(p.productId),
        quantity: p.quantity,
      }));
      bundle.MRP = totalMRP;
      bundle.sellingPrice = sellingPrice;
      bundle.discount = discount || bundle.discount;

      // Update product references in the database
      const updatedProductIds = products.map((p) => p.productId.toString());

      // Remove the old bundle ID from products
      await Product.updateMany(
        {
          _id: {
            $in: oldProductIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
          bundleId: new mongoose.Types.ObjectId(bundleId),
        },
        { $unset: { bundleId: '' } }
      );

      // Add the new bundle ID to products
      await Product.updateMany(
        {
          _id: {
            $in: updatedProductIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
        { $set: { bundleId: new mongoose.Types.ObjectId(bundleId) } }
      );
    }

    // Update name and description if provided
    if (name) bundle.name = name;
    if (description) bundle.description = description;

    await bundle.save();
    res.status(200).json({
      message: 'Bundle updated successfully',
      bundle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update bundle', error });
  }
};
