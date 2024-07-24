
import { Request, Response } from 'express';
import Discount from '../../../models/discountModel';
import Product from '../../../models/productModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const removeDiscount = async (req: CustomRequest, res: Response) => {
  const { discountId } = req.query;
  const sellerAuthId = req.user?.userId;

  try {
    const discount = await Discount.findById(discountId);

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    if (discount.sellerAuthId.toString() !== sellerAuthId) {
      return res.status(403).json({ message: 'You do not own this discount' });
    }

    await Discount.findByIdAndDelete(discountId);


    await Product.updateMany(
      { discounts: discountId },
      { $pull: { discounts: discountId } }
    );

    res.status(200).json({ message: 'Discount deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete discount', error });
  }
};
