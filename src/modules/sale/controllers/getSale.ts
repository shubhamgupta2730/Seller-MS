import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sale from '../../../models/saleModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

interface Category {
  _id: mongoose.Types.ObjectId;
  name: string;
}

interface ProductData {
  MRP: number;
  _id: mongoose.Types.ObjectId;
  name: string;
  sellingPrice: number;
  categoryId: mongoose.Types.ObjectId;
}

interface BundleProduct {
  productId: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };
}

interface BundleData {
  _id: mongoose.Types.ObjectId;
  name: string;
  sellingPrice: number;
  products: BundleProduct[];
}

interface SaleDocument extends mongoose.Document {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  categories: Array<{ categoryId: Category; discount: number }>;
  products: Array<{ productId: ProductData }>;
  bundles: Array<{ bundleId: BundleData }>;
  createdBy: mongoose.Types.ObjectId;
}

export const getSellerSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;
  const sellerId = req.user?.userId;

  // Validate Sale ID
  if (!saleId || !mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  try {
    const now = new Date();

    // Find the sale with the given saleId and ensure it belongs to the seller
    const sale = (await Sale.findOne({
      _id: saleId,
      isDeleted: false,
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } }, // Ongoing sales
        { startDate: { $gt: now } }, // Upcoming sales
      ],
    })
      .populate({
        path: 'categories.categoryId',
        select: 'name',
      })
      .populate({
        path: 'products.productId',
        select: 'name sellingPrice categoryId MRP',
      })
      .populate({
        path: 'bundles.bundleId',
        select: 'name sellingPrice products',
        populate: {
          path: 'products.productId',
          select: 'name',
        },
      })) as SaleDocument | null;

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found, or no ongoing/upcoming sale found.',
      });
    }

    const formattedSale = {
      id: sale._id,
      name: sale.name,
      description: sale.description,
      startDate: sale.startDate.toLocaleDateString(),
      endDate: sale.endDate.toLocaleDateString(),
      isActive: sale.isActive,
      categories: sale.categories.map((cat) => {
        const category = cat.categoryId;

        const productsInCategory = sale.products
          .map((p) => p.productId)
          .filter((product) => product.categoryId.equals(category._id))
          .map((product) => ({
            productId: product._id,
            productName: product.name,
            MRP: product.MRP,
            sellingPrice: product.sellingPrice,
          }));

        return {
          categoryId: category._id,
          categoryName: category.name || 'Unknown',
          discount: cat.discount,
          products: productsInCategory,
        };
      }),
      bundles: sale.bundles.map((bundle) => {
        const populatedBundle = bundle.bundleId;

        return {
          bundleId: populatedBundle._id,
          bundleName: populatedBundle.name,
          sellingPrice: populatedBundle.sellingPrice,
          products: populatedBundle.products.map((product) => ({
            productId: product.productId._id,
            productName: product.productId.name,
          })),
        };
      }),
    };

    return res.status(200).json({
      message: 'Sale details fetched successfully',
      sale: formattedSale,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to retrieve sale details',
      error: err.message,
    });
  }
};
