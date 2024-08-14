import { Request, Response } from 'express';
import mongoose, { Schema } from 'mongoose';
import { Product } from '../../../models/index';
import Category from '../../../models/categoryModel';

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
    // Check if a product with the same name already exists
    const existingProduct = await Product.findOne({ name, sellerId });
    if (existingProduct) {
      return res.status(400).json({ message: 'A product with this name already exists' });
    }

    let category = null;
    if (categoryId) {
      category = await Category.findOne({
        _id: categoryId,
        isActive: true,
      });

      if (!category) {
        return res.status(400).json({ message: 'Category does not exist' });
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

    // Save the new product to the database
    const savedProduct = await newProduct.save();

    // If categoryId is provided, update the Category's productIds array
    if (categoryId && category) {
      category.productIds.push(savedProduct._id as Schema.Types.ObjectId);
      await category.save();
    }

    // Filter the response fields
    const response = {
      _id: savedProduct._id,
      name: savedProduct.name,
      description: savedProduct.description,
      MRP: savedProduct.MRP,
      sellingPrice: savedProduct.sellingPrice,
      quantity: savedProduct.quantity,
      discount: savedProduct.discount,
      categoryId: savedProduct.categoryId,
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
