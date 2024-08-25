import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bundle, Product } from '../../../models/index';
import User from '../../../models/userModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'seller' | 'admin';
  };
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
    products: string[];
    discount: number;
  } = req.body;

  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate name, description, discount, and products array
  if (!name || typeof name !== 'string' || name.trim() === '') {
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
      .json({ message: 'Products are required to create a bundle' });
  }

  try {
    // Validate product IDs
    const invalidProductIds = products.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidProductIds.length > 0) {
      return res.status(400).json({
        message: `Invalid product IDs: ${invalidProductIds.join(', ')}`,
      });
    }

    // Fetch the active products owned by the seller/admin that are not deleted or blocked
    const query: any = {
      _id: { $in: products },
      isActive: true,
      isDeleted: false,
      isBlocked: false,
    };
    if (userRole === 'seller') {
      query.sellerId = new mongoose.Types.ObjectId(userId);
    }

    const ownedProducts = await Product.find(query).exec();

    // Check if the fetched products match the provided product IDs
    if (ownedProducts.length !== products.length) {
      return res.status(403).json({
        message:
          'Unauthorized to bundle one or more products or products are not active, deleted, or blocked',
      });
    }

    // Calculate total MRP
    const totalMRP = ownedProducts.reduce(
      (sum, product) => sum + product.MRP,
      0
    );

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
      products: products.map((productId) => ({
        productId: new mongoose.Types.ObjectId(productId),
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
      { _id: { $in: products } },
      { $push: { bundleIds: savedBundle._id } }
    );

    // Fetch the seller's name
    const seller = await User.findById(userId).select('firstName lastName');
    const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : null;

    // Generate the response with product names
    const response = {
      _id: savedBundle._id,
      name: savedBundle.name,
      description: savedBundle.description,
      MRP: savedBundle.MRP,
      sellingPrice: savedBundle.sellingPrice,
      discount: savedBundle.discount,
      products: ownedProducts.map((p) => ({
        productId: p._id,
        productName: p.name,
        MRP: p.MRP,
      })),
      createdBy: {
        _id: userId,
        name: sellerName,
      },
      createdAt: savedBundle.createdAt,
      updatedAt: savedBundle.updatedAt,
    };

    res.status(201).json({
      message: 'Bundle created successfully',
      bundle: response,
    });
  } catch (error) {
    console.error('Failed to create bundle', error);
    res.status(500).json({ message: 'Failed to create bundle', error });
  }
};
