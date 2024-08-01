import { Request, Response } from 'express';
import Seller, { ISeller } from '../../../models/sellerModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user' | 'seller';
  };
}

export const viewSellerProfile = async (req: CustomRequest, res: Response) => {
  const sellerId = req.user?.userId;

  try {
    const sellerProfile: ISeller | null = await Seller.findOne({
      userId: sellerId,
    });
    if (!sellerProfile) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    const sellers = {
      shopName: sellerProfile.shopName,
      shopDescription: sellerProfile.shopDescription,
      shopContactNumber: sellerProfile.shopContactNumber,
      businessLicense: sellerProfile.businessLicense,
      taxId: sellerProfile.taxId,
      website: sellerProfile.website,
    };

    return res.status(200).json({
      message: 'Seller profile',
      sellers,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve seller profile',
      error,
    });
  }
};
