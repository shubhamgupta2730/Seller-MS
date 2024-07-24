// src/controllers/discountController.ts
import { Request, Response } from 'express';
import Discount from '../../../models/discountModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const updateDiscount = async (req: CustomRequest, res: Response) => {
  const { discountId } = req.query;
  const { discountType, discountValue, startDate, endDate } = req.body;
  const sellerAuthId = req.user?.userId;

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

    res.status(200).json({
      message: 'Discount updated successfully',
      discount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update discount', error });
  }
};
