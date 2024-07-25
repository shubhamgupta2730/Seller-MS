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

export const addDiscount = async (req: CustomRequest, res: Response) => {
  const {
    productId,
    bundleId,
    discountType,
    discountValue,
    startDate,
    endDate,
  } = req.body;
  const sellerAuthId = req.user?.userId;

  try {
    // Check if the discount is applied to a product or a bundle
    let entity;
    if (productId) {
      entity = await Product.findById(productId);
    } else if (bundleId) {
      entity = await BundleProduct.findById(bundleId);
    }

    if (!entity) {
      return res
        .status(404)
        .json({ message: 'Select Product or Bundle first.' });
    }

    if (entity.sellerAuthId.toString() !== sellerAuthId) {
      return res.status(403).json({ message: 'You do not have access.' });
    }

   
    const newDiscount = new Discount({
      productId,
      bundleId,
      sellerAuthId,
      discountType,
      discountValue,
      startDate,
      endDate,
    });

    await newDiscount.save();

    // Ensure entity.discounts is initialized
    if (!entity.discounts) {
      entity.discounts = [];
    }

    // Add the discount to the entity if valid
    const currentDate = new Date();
    if (
      new Date(startDate) <= currentDate &&
      new Date(endDate) >= currentDate
    ) {
      entity.discounts.push(newDiscount._id as mongoose.Types.ObjectId);

      // Calculate the new final price
      entity.finalPrice = await calculateFinalPrice(
        entity.price,
        entity.discounts,
        entity.products // Pass products array 
      );
      await entity.save();
    }

    res.status(201).json({
      message: 'Discount added successfully',
      discount: newDiscount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add discount', error });
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
