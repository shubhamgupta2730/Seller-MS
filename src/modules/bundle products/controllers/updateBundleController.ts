import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bundle, Product } from '../../../models/index';

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
    return res.status(400).json({ message: 'Invalid bundle ID format' });
  }

  try {
    // Find the existing bundle
    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    if (bundle.sellerId?.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to update this bundle' });
    }

    // Track old product IDs and quantities
    const oldProductsMap = new Map(
      bundle.products.map((p) => [p.productId.toString(), p.quantity])
    );

    // Validate and add/update products in the bundle
    if (products && Array.isArray(products)) {
      const newProductIds = new Set<string>();
      const productUpdates = new Map<string, number>();

      // Extract product IDs and quantities from the new products array
      products.forEach((product: ProductInfo) => {
        const productId = product.productId;
        const quantity = product.quantity;
        newProductIds.add(productId);
        productUpdates.set(
          productId,
          (productUpdates.get(productId) || 0) + quantity
        );
      });

      // Ensure the seller owns all the products and they are active
      const productIds = Array.from(newProductIds);
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
      for (const [productId, quantity] of productUpdates.entries()) {
        if (!productPriceMap[productId]) {
          return res
            .status(404)
            .json({ message: `Product with ID ${productId} not found` });
        }

        totalMRP += productPriceMap[productId] * quantity;
      }

      // Calculate selling price based on discount percentage
      let sellingPrice = totalMRP;
      if (discount) {
        sellingPrice = totalMRP - totalMRP * (discount / 100);
      }

      // Update the bundle's product, price, and discount details
      bundle.products = Array.from(productUpdates.entries()).map(
        ([productId, quantity]) => ({
          productId: new mongoose.Types.ObjectId(productId),
          quantity,
        })
      );
      bundle.MRP = totalMRP;
      bundle.sellingPrice = sellingPrice;
      bundle.discount = discount || bundle.discount;

      // Update product references in the database
      const newProductIdsArray = Array.from(newProductIds);

      // Remove the old bundle ID from products that are no longer in the bundle
      await Product.updateMany(
        {
          _id: {
            $in: Array.from(oldProductsMap.keys()).filter(
              (oldProductId) => !newProductIdsArray.includes(oldProductId)
            ),
          },
        },
        { $unset: { bundleId: '' } }
      );

      // Add the new bundle ID to products
      await Product.updateMany(
        {
          _id: {
            $in: newProductIdsArray.map(
              (id) => new mongoose.Types.ObjectId(id)
            ),
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
