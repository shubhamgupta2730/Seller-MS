import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bundle, Product } from '../../../models/index';
import User from '../../../models/userModel';

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
  const {
    name,
    description,
    products,
    discount,
  }: {
    name: string;
    description: string;
    products: ProductInfo[];
    discount: number;
  } = req.body;
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

  // Validate name, description, discount, and products array
  if (name && (typeof name !== 'string' || name.trim() === '')) {
    return res
      .status(400)
      .json({ message: 'Invalid name: Name must be a non-empty string' });
  }

  if (
    description &&
    (typeof description !== 'string' || description.trim() === '')
  ) {
    return res.status(400).json({
      message: 'Invalid description: Description must be a non-empty string',
    });
  }

  if (
    discount !== undefined &&
    (typeof discount !== 'number' || discount < 0 || discount > 100)
  ) {
    return res.status(400).json({
      message: 'Invalid discount: Discount must be a number between 0 and 100',
    });
  }

  if (products && (!Array.isArray(products) || products.length === 0)) {
    return res
      .status(400)
      .json({ message: 'Products array should not be empty' });
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

    const oldProductsMap = new Map(
      bundle.products.map((p) => [p.productId.toString(), p.quantity])
    );

    let totalMRP = 0;
    const productPriceMap: { [key: string]: number } = {};
    const productNameMap: { [key: string]: string } = {};

    if (products && Array.isArray(products)) {
      const newProductIds = new Set<string>();
      const productUpdates = new Map<string, number>();

      // Extract product IDs and quantities from the new products array
      products.forEach((product: ProductInfo) => {
        const productId = product.productId;
        const quantity = product.quantity;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
          return res
            .status(400)
            .json({ message: `Invalid product ID: ${productId}` });
        }

        if (typeof quantity !== 'number' || quantity <= 0) {
          return res.status(400).json({
            message: `Invalid quantity for product ID ${productId}: Quantity must be a positive number`,
          });
        }

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
        isDeleted: false,
        isBlocked: false,
      });

      if (ownedProducts.length !== productIds.length) {
        return res.status(403).json({
          message:
            'Unauthorized to update one or more products or products are not active, deleted, or blocked',
        });
      }

      // Store prices and names of owned products
      ownedProducts.forEach((product) => {
        const productId = (product._id as mongoose.Types.ObjectId).toString();
        productPriceMap[productId] = product.MRP;
        productNameMap[productId] = product.name;
      });

      // Calculate total MRP
      for (const [productId, quantity] of productUpdates.entries()) {
        if (!productPriceMap[productId]) {
          return res
            .status(404)
            .json({ message: `Product with ID ${productId} not found` });
        }

        totalMRP += productPriceMap[productId] * quantity;
      }

      // Calculate the selling price based on the updated discount
      let sellingPrice = totalMRP;
      if (discount !== undefined) {
        sellingPrice = totalMRP - (totalMRP * discount) / 100;
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
      bundle.discount = discount !== undefined ? discount : bundle.discount;

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

    // Fetch the seller's name
    const seller = await User.findById(sellerId).select('firstName lastName');
    const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : null;

    // Generate the response with product names
    const response = {
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      MRP: bundle.MRP,
      sellingPrice: bundle.sellingPrice,
      discount: bundle.discount,
      products: bundle.products.map((p) => ({
        productId: p.productId.toString(),
        productName: productNameMap[p.productId.toString()],
        quantity: p.quantity,
      })),
      createdBy: {
        _id: sellerId,
        name: sellerName,
      },
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
    };

    res.status(200).json({ message: 'Bundle updated successfully', bundle: response });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update bundle', error });
  }
};
