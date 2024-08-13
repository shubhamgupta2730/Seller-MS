import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../../../models/index';
import Category from '../../../models/categoryModel';
import User from '../../../models/userModel';
import Seller from '../../../models/sellerModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const createProduct = async (req: CustomRequest, res: Response) => {
  const { name, description, MRP, discount, quantity, categoryId } = req.body;

  const sellerId = req.user?.userId;

  if (!sellerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate each field individually
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing product name' });
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ message: 'Invalid product description' });
  }

  if (!MRP || typeof MRP !== 'number' || MRP <= 0) {
    return res.status(400).json({ message: 'Invalid or missing MRP' });
  }

  if (
    discount === undefined ||
    typeof discount !== 'number' ||
    discount < 0 ||
    discount > 100
  ) {
    return res.status(400).json({ message: 'Invalid discount' });
  }

  if (
    !quantity ||
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return res.status(400).json({ message: 'Invalid or missing quantity' });
  }

  if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  try {
    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        isActive: true,
      });
      if (!category) {
        return res
          .status(400)
          .json({ message: 'Category does not exist or is not active' });
      }
    }

    // Calculate the selling price based on the discount percentage
    const sellingPrice = MRP - MRP * (discount / 100);

    const newProduct = new Product({
      sellerId,
      name,
      description,
      MRP,
      sellingPrice,
      quantity,
      discount,
      categoryId: categoryId || null,
      createdBy: sellerId,
    });

    await newProduct.save();

    // Fetch the seller's name from the User collection

    const seller = await User.findById(sellerId).select('firstName lastName');
    if(!seller?.firstName || !seller.lastName){
      return res.status(401).json({message: 'Name not found'})
    }
    const sellerName = seller?.firstName +" "+ seller?.lastName

    // Filter the response fields
    const response = {
      _id: newProduct._id,
      name: newProduct.name,
      description: newProduct.description,
      MRP: newProduct.MRP,
      sellingPrice: newProduct.sellingPrice,
      quantity: newProduct.quantity,
      discount: newProduct.discount,
      categoryId: newProduct.categoryId,
      createdBy: {
        _id: sellerId,
        name: seller ? sellerName  : null,
      },
      createdAt: newProduct.createdAt,
      updatedAt: newProduct.updatedAt,
    };

    res.status(201).json({
      message: 'Product created successfully',
      product: response,
    });
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(500).json({ message: 'Failed to create product', error });
  }
};
