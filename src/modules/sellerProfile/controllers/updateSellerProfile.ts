import { Request, Response } from 'express';
import Seller from '../../../models/sellerModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user' | 'seller';
  };
}

export const updateSellerProfile = async (
  req: CustomRequest,
  res: Response
) => {
  const {
    shopName,
    shopDescription,
    shopContactNumber,
    businessLicense,
    taxId,
    website,
  } = req.body;

  const userId = req.user?.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID not found' });
  }

  const updateFields: { [key: string]: any } = {};

  if (shopName !== undefined) {
    if (typeof shopName !== 'string' || shopName.length < 3) {
      return res.status(400).json({
        message: 'Shop name must be a string and at least 3 characters long',
      });
    }
    updateFields.shopName = shopName;
  }

  if (shopDescription !== undefined) {
    if (typeof shopDescription !== 'string' || shopDescription.length < 10) {
      return res.status(400).json({
        message:
          'Shop description must be a string and at least 10 characters long',
      });
    }
    updateFields.shopDescription = shopDescription;
  }

  if (shopContactNumber !== undefined) {
    if (typeof shopContactNumber !== 'number') {
      return res
        .status(400)
        .json({ message: 'Shop contact number must be a number' });
    }
    if (!/^\d{10,15}$/.test(shopContactNumber.toString())) {
      return res
        .status(400)
        .json({ message: 'Contact number must be between 10 and 15 digits' });
    }
    updateFields.shopContactNumber = shopContactNumber;
  }

  if (businessLicense !== undefined) {
    if (typeof businessLicense !== 'string') {
      return res
        .status(400)
        .json({ message: 'Business license must be a string' });
    }
    updateFields.businessLicense = businessLicense;
  }

  if (taxId !== undefined) {
    if (typeof taxId !== 'string') {
      return res.status(400).json({ message: 'Tax ID must be a string' });
    }
    updateFields.taxId = taxId;
  }

  if (website !== undefined) {
    if (typeof website !== 'string') {
      return res.status(400).json({ message: 'Website must be a string' });
    }
    if (!/^https?:\/\/[\w\-]+\.[\w\-]+/.test(website)) {
      return res.status(400).json({ message: 'Invalid website URL' });
    }
    updateFields.website = website;
  }

  try {
    const updatedSeller = await Seller.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedSeller) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    res.status(200).json({
      message: 'Seller profile updated successfully',
      seller: updatedSeller,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update seller profile', error });
  }
};
