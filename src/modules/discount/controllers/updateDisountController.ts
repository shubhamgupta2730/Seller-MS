import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../../../models/productModel';
import Discount from '../../../models/discountModel';
import BundleProduct from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const updateDiscount = async (req: CustomRequest, res: Response) => {
  const { discountId } = req.query;
  const { discountType, discountValue, startDate, endDate } = req.body;
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

    discount.discountType = discountType;
    discount.discountValue = discountValue;
    discount.startDate = startDate;
    discount.endDate = endDate;

    await discount.save();

    let entity;
    if (discount.productId) {
      entity = await Product.findById(discount.productId);
    } else if (discount.bundleId) {
      entity = await BundleProduct.findById(discount.bundleId);
    }

    if (entity) {
      // Check if the discount is currently valid
      const currentDate = new Date();
      if (
        new Date(startDate) <= currentDate &&
        new Date(endDate) >= currentDate
      ) {
        // Add discount if valid
        if (!entity.discounts.includes(discount._id)) {
          entity.discounts.push(discount._id as mongoose.Types.ObjectId);
        }
      } else {
        // Remove discount if no longer valid
        entity.discounts = entity.discounts.filter(
          (id) => id.toString() !== discount._id.toString()
        );
      }

      entity.finalPrice = await calculateFinalPrice(
        entity.price,
        entity.discounts
      );
      await entity.save();
    }

    res.status(200).json({
      message: 'Discount updated successfully',
      discount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update discount', error });
  }
};

const calculateFinalPrice = async (
  price: number,
  discounts: mongoose.Types.ObjectId[]
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
