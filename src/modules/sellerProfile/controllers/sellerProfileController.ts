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
    firstName,
    lastName,
    dob,
    gender,
    shopName,
    shopDescription,
    address,
    shopContactNumber,
    businessLicense,
    taxId,
    website,
  } = req.body;

  const userId = req.user?.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID not found' });
  }

  if (!firstName || !lastName || !shopName || !shopDescription || !address) {
    return res.status(400).json({ message: 'Missing required fields' });
  }


  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof shopName !== 'string' ||
    typeof shopDescription !== 'string' ||
    typeof address !== 'string'
  ) {
    return res.status(400).json({ message: 'Invalid data types' });
  }

  if (firstName.length < 2 || lastName.length < 2) {
    return res
      .status(400)
      .json({ message: 'Names must be at least 2 characters long' });
  }

  if (shopName.length < 3) {
    return res
      .status(400)
      .json({ message: 'Shop name must be at least 3 characters long' });
  }

  // Validate date of birth
  if (dob && !isValidDate(dob)) {
    return res.status(400).json({ message: 'Invalid date of birth format' });
  }

  // Validate contact number format 
  if (shopContactNumber && !/^\+?[1-9]\d{1,14}$/.test(shopContactNumber)) {
    return res.status(400).json({ message: 'Invalid contact number format' });
  }

  try {
    const newSeller = new Seller({
      userId: userId,
      firstName,
      lastName,
      dob,
      gender,
      shopName,
      shopDescription,
      address,
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

//  function to validate date format 
const isValidDate = (dateString: string) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regex)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};
