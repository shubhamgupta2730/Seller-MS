import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bundle } from '../../../models/index';
import User from '../../../models/userModel';

// Define an interface for the Product schema
interface ProductDetails {
  _id: mongoose.Types.ObjectId;
  name: string;
  MRP: number;
  sellingPrice: number;
}

// Define a type for BundleProduct
interface BundleProductDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  MRP: number;
  sellingPrice: number;
  discount: number;
  products: {
    productId: ProductDetails;
    quantity: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getBundleDetails = async (req: CustomRequest, res: Response) => {
  const { bundleId } = req.query;
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
    const bundle = (await Bundle.findOne({
      _id: bundleId,
      sellerId: new mongoose.Types.ObjectId(sellerId),
      isActive: true,
      isDeleted: false,
    }).populate({
      path: 'products.productId',
      select: 'name MRP sellingPrice',
    })) as BundleProductDocument | null;

    if (!bundle) {
      return res
        .status(404)
        .json({ message: 'Bundle not found or unauthorized' });
    }

    // Fetch the seller's information
    const seller = await User.findById(sellerId).select('firstName lastName');
    const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : null;

    const response = {
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      MRP: bundle.MRP,
      sellingPrice: bundle.sellingPrice,
      discount: bundle.discount,
      products: bundle.products.map((product) => ({
        productId: product.productId._id,
        name: product.productId.name,
        MRP: product.productId.MRP,
        sellingPrice: product.productId.sellingPrice,
        quantity: product.quantity,
      })),
      // createdBy: {
      //   _id: sellerId,
      //   name: sellerName,
      // },
      // createdAt: bundle.createdAt,
      // updatedAt: bundle.updatedAt,
    };

    res.status(200).json({
      message: 'Bundle retrieved successfully',
      bundle: response,
    });
  } catch (error) {
    console.error('Failed to retrieve bundle details', error);
    res
      .status(500)
      .json({ message: 'Failed to retrieve bundle details', error });
  }
};
