import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bundle, Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'seller' | 'admin';
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
    discount,
  }: {
    name: string;
    description: string;
    products: ProductInfo[];
    discount: number;
  } = req.body;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate name, description, discount, and products array
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Invalid name: Name is required' });
  }

  if (typeof description !== 'string' || description.trim() === '') {
    return res
      .status(400)
      .json({ message: 'Invalid description: Description is required' });
  }

  if (typeof discount !== 'number' || discount < 0 || discount > 100) {
    return res.status(400).json({
      message: 'Invalid discount: Discount must be a number between 0 and 100',
    });
  }

  if (!Array.isArray(products) || products.length === 0) {
    return res
      .status(400)
      .json({ message: 'Products array is required and should not be empty' });
  }

  try {
    // Validate product IDs and quantities
    const productIds = products.map((p) => p.productId);
    const invalidProductIds = productIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidProductIds.length > 0) {
      return res.status(400).json({
        message: `Invalid product IDs: ${invalidProductIds.join(', ')}`,
      });
    }

    const productQuantities = products.map((p) => p.quantity);
    const invalidQuantities = productQuantities.filter(
      (qty) => typeof qty !== 'number' || qty <= 0
    );
    if (invalidQuantities.length > 0) {
      return res.status(400).json({
        message: 'Invalid quantities: Quantities must be positive numbers',
      });
    }

    // Fetch the active products owned by the seller that are not deleted or blocked
    const query: any = {
      _id: { $in: productIds },
      isActive: true,
      isDeleted: false,
      isBlocked: false,
    };
    if (userRole === 'seller') {
      query.sellerId = new mongoose.Types.ObjectId(userId);
    }

    const ownedProducts = await Product.find(query).exec();

    // Check if the fetched products match the provided product IDs
    if (ownedProducts.length !== productIds.length) {
      return res.status(403).json({
        message:
          'Unauthorized to bundle one or more products or products are not active, deleted, or blocked',
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
    if (discount) {
      sellingPrice = totalMRP - totalMRP * (discount / 100);
    }

    // Create new bundle
    const newBundle = new Bundle({
      name,
      description,
      MRP: totalMRP,
      sellingPrice,
      discount,
      products: products.map((p) => ({
        productId: new mongoose.Types.ObjectId(p.productId),
        quantity: p.quantity,
      })),
      sellerId:
        userRole === 'seller' ? new mongoose.Types.ObjectId(userId) : undefined,
      adminId:
        userRole === 'admin' ? new mongoose.Types.ObjectId(userId) : undefined,
      createdBy: {
        id: new mongoose.Types.ObjectId(userId),
        role: userRole,
      },
      isActive: true,
      isDeleted: false,
      isBlocked: false,
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
