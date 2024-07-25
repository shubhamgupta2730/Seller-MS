import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Discount from '../../../models/discountModel';
import Product from '../../../models/productModel';
import BundleProduct from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const removeDiscount = async (req: CustomRequest, res: Response) => {
  const { discountId } = req.query;
  const sellerAuthId = req.user?.userId;

  if (!sellerAuthId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const discount = await Discount.findById(discountId);

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    if (discount.sellerAuthId.toString() !== sellerAuthId) {
      return res.status(403).json({ message: 'You do not own this discount' });
    }

    // Delete the discount
    await Discount.findByIdAndDelete(discountId);

    let entity;
    if (discount.productId) {
      entity = await Product.findById(discount.productId);
      if (entity) {
        // Remove the discount from the product's list
        entity.discounts = entity.discounts.filter(
          (id) => id.toString() !== discountId
        );
        // Recalculate the final price
        entity.finalPrice = await calculateFinalPrice(
          entity.price,
          entity.discounts
        );
        await entity.save();
      }
    } else if (discount.bundleId) {
      entity = await BundleProduct.findById(discount.bundleId);
      if (entity) {
        // Remove the discount from the bundle's list
        entity.discounts = entity.discounts.filter(
          (id) => id.toString() !== discountId
        );
        // Recalculate the final price
        entity.finalPrice = await calculateFinalPrice(
          entity.price,
          entity.discounts,
          entity.products // Include products for bundles
        );
        await entity.save();
      }
    }

    res.status(200).json({ message: 'Discount deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete discount', error });
  }
};

const calculateFinalPrice = async (
  price: number,
  discounts: mongoose.Types.ObjectId[],
  products?: { productId: string; quantity: number }[]
) => {
  let finalPrice = price;

  for (const discountId of discounts) {
    const discount = await Discount.findById(discountId);
    if (discount) {
      finalPrice = applyDiscount(
        finalPrice,
        discount.discountType,
        discount.discountValue
      );
    }
  }

  // If products are present, recalculate price for quantities
  if (products) {
    for (const { productId, quantity } of products) {
      const product = await Product.findById(productId);
      if (product) {
        finalPrice += product.price * quantity;
      }
    }
  }

  return finalPrice;
};

const applyDiscount = (
  price: number,
  discountType: string,
  discountValue: number
) => {
  switch (discountType) {
    case 'percentage':
      return price - (price * discountValue) / 100;
    case 'fixed':
      return price - discountValue;
    default:
      return price;
  }
};
