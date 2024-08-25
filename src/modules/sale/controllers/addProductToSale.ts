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

interface ISaleProduct {
  productId: mongoose.Types.ObjectId;
}

interface ISaleBundle {
  bundleId: mongoose.Types.ObjectId;
}

// Function to apply discounts to newly added products and bundles
const applyDiscountsToNewItems = async (
  sale: any,
  newProducts: ISaleProduct[],
  newBundles: ISaleBundle[]
) => {
  for (const saleProduct of newProducts) {
    const product = await Product.findById(saleProduct.productId);

    if (!product) {
      console.error(`Product not found for ID: ${saleProduct.productId}`);
      continue;
    }

    const productCategoryId = String(product.categoryId);
    const saleCategory = sale.categories.find((cat: any) => {
      return productCategoryId === String(cat.categoryId._id);
    });

    if (!saleCategory) {
      console.warn(
        `No matching sale category found for product category ID: ${productCategoryId}`
      );
      continue;
    }

    const discount = saleCategory.discount || 0;
    const discountedPrice = product.sellingPrice * (1 - discount / 100);
    const roundedDiscountedPrice = Math.round(discountedPrice);

    product.sellingPrice = roundedDiscountedPrice;
    product.adminDiscount = discount;
    await product.save();
  }

  for (const saleBundle of newBundles) {
    const bundle = await Bundle.findById(saleBundle.bundleId);
    if (bundle) {
      let maxDiscount = 0;
      let totalSellingPrice = 0;

      for (const bundleProduct of bundle.products) {
        const product = await Product.findById(bundleProduct.productId);
        if (product) {
          const saleCategory = sale.categories.find((cat: any) => {
            return String(product.categoryId) === String(cat.categoryId._id);
          });
          const discount = saleCategory ? saleCategory.discount : 0;

          if (discount > maxDiscount) {
            maxDiscount = discount;
          }

          totalSellingPrice += product.sellingPrice;
        }
      }

      const discountedBundlePrice = totalSellingPrice * (1 - maxDiscount / 100);
      const roundedDiscountedBundlePrice = Math.round(discountedBundlePrice);

      bundle.sellingPrice = roundedDiscountedBundlePrice;
      bundle.adminDiscount = maxDiscount;
      await bundle.save();
    }
  }
};

export const sellerAddProductsToSale = async (
  req: CustomRequest,
  res: Response
) => {
  const saleId = req.query.saleId as string;
  const { products } = req.body;
  const sellerId = req.user?.userId;

  if (!saleId || !mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      message: 'The products field must be a non-empty array.',
    });
  }

  try {
    const sale = await Sale.findOne({ _id: saleId, isDeleted: false }).populate(
      'categories.categoryId'
    );

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found or has been deleted.',
      });
    }

    const now = new Date();
    if (sale.endDate <= now) {
      return res.status(400).json({
        message: 'Cannot add products to a sale that has ended.',
      });
    }

    const existingProductIds = sale.products.map((p) => p.productId.toString());
    const existingBundleIds = sale.bundles.map((b) => b.bundleId.toString());

    const validProducts: ISaleProduct[] = [];
    const validBundles: ISaleBundle[] = [];

    for (const product of products) {
      const productId = product.productId;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          message: `Invalid product ID: ${productId}.`,
        });
      }

      if (existingProductIds.includes(productId)) {
        return res.status(400).json({
          message: `Product with ID ${productId} is already added to this sale.`,
        });
      }

      const productData = await Product.findOne({
        _id: productId,
        isActive: true,
        isDeleted: false,
        isBlocked: false,
        createdBy: sellerId,
      });

      if (!productData) {
        return res.status(400).json({
          message: `Product with ID ${productId} is either inactive, deleted, blocked, or not owned by you.`,
        });
      }

      const saleCategory = sale.categories.find((cat) =>
        productData.categoryId?.equals(cat.categoryId._id)
      );

      if (!saleCategory) {
        return res.status(400).json({
          message: `Product with ID ${productId} does not belong to any of the sale's categories.`,
        });
      }

      const saleProduct: ISaleProduct = {
        productId: new mongoose.Types.ObjectId(productId),
      };
      validProducts.push(saleProduct);

      const bundlesContainingProduct = await Bundle.find({
        'products.productId': productId,
        isActive: true,
        isDeleted: false,
        isBlocked: false,
        createdBy: sellerId,
      });

      for (const bundle of bundlesContainingProduct) {
        const bundleId = bundle._id as mongoose.Types.ObjectId;

        if (existingBundleIds.includes(bundleId.toString())) {
          continue;
        }

        const saleBundle: ISaleBundle = {
          bundleId,
        };

        validBundles.push(saleBundle);
      }
    }

    sale.products = sale.products.concat(validProducts);
    sale.bundles = sale.bundles.concat(validBundles);
    await sale.save();

    if (sale.startDate <= now) {
      // Apply discounts only if the sale is ongoing
      await applyDiscountsToNewItems(sale, validProducts, validBundles);
    }

    return res.status(200).json({
      message: 'Products and related bundles added to the sale successfully.',
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to add products or bundles to sale',
      error: err.message,
    });
  }
};
