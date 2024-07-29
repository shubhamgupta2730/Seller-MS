import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BundleProduct, Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

interface ProductInfo {
  productId: string;
  quantity: number;
}

export const createBundle = async (req: CustomRequest, res: Response) => {
  const {
    name,
    description,
    products,
    discountPercentage,
  }: {
    name: string;
    description: string;
    products: ProductInfo[];
    discountPercentage: number;
  } = req.body;
  const sellerId = req.user?.userId;

  if (!sellerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check if products is an array and not empty
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: 'Products array is required and should not be empty',
      });
    }

    // Extract product IDs
    const productIds = products.map(
      (p) => new mongoose.Types.ObjectId(p.productId)
    );

    // Fetch the active products owned by the seller
    const ownedProducts = await Product.find({
      _id: { $in: productIds },
      sellerId: new mongoose.Types.ObjectId(sellerId),
      isActive: true,
    }).exec();

    // Check if the fetched products match the provided product IDs
    if (ownedProducts.length !== productIds.length) {
      return res.status(403).json({
        message:
          'Unauthorized to bundle one or more products or products are not active',
      });
    }

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
    if (discountPercentage) {
      sellingPrice = totalMRP - totalMRP * (discountPercentage / 100);
    }

    // Create new bundle
    const newBundle = new BundleProduct({
      name,
      description,
      MRP: totalMRP,
      sellingPrice,
      discountPercentage,
      products: products.map((p) => ({
        productId: new mongoose.Types.ObjectId(p.productId),
        quantity: p.quantity,
      })),
      sellerId: new mongoose.Types.ObjectId(sellerId),
      isActive: true,
    });

    const savedBundle = await newBundle.save();

    // Update products to reference the new bundle
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { bundleId: savedBundle._id } }
    );

    res.status(201).json({
      message: 'Bundle created successfully',
      bundle: savedBundle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create bundle', error });
  }
};
