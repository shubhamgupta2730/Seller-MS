import { Request, Response } from 'express';
import Seller from '../../../models/sellerModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user' | 'seller';
  };
}

export const createSellerProfile = async (
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

  if ( !shopName || !shopDescription) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (
    typeof shopName !== 'string' ||
    typeof shopDescription !== 'string' 
  ) {
    return res.status(400).json({ message: 'Invalid data types' });
  }


  if (shopName.length < 3) {
    return res
      .status(400)
      .json({ message: 'Shop name must be at least 3 characters long' });
  }



  try {
    const newSeller = new Seller({
      userId: userId,
      shopName,
      shopDescription,
      shopContactNumber,
      businessLicense,
      taxId,
      website,
    });

    await newSeller.save();

    res.status(201).json({
      message: 'Seller profile created successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create seller profile', error });
  }
};

