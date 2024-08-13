// controllers/categoryController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category, { ICategory } from '../../../models/categoryModel';
import Product, { IProduct } from '../../../models/productModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getCategoryById = async (req: CustomRequest, res: Response) => {
  try {
    const categoryId = req.query.id as string;
    const sellerId = req.user?.userId;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized: Seller ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'Invalid Category ID format' });
    }

    // Find the category by ID
    const category: ICategory | null = await Category.findById(categoryId).select(
      'name description isActive productIds'
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (!category.isActive) {
      return res.status(403).json({ message: 'No category found' });
    }

    if (!category.productIds || category.productIds.length === 0) {
      return res.status(200).json({
        _id: category._id?.toString(),
        name: category.name,
        description: category.description,
        products: [],
      });
    }

    // Find all products associated with the seller in the category
    const products: IProduct[] = await Product.find({
      _id: { $in: category.productIds },
      sellerId: new mongoose.Types.ObjectId(sellerId), 
      isActive: true,
      isDeleted: false,
      isBlocked: false,
    }).select('name');

    if (products.length === 0) {
      console.log(`No products found for seller ID ${sellerId} in category ${categoryId}`);
    }

    const response = {
      _id: category._id?.toString(),
      name: category.name,
      description: category.description,
      products: products.map((product) => ({
        productId: product._id?.toString(),
        productName: product.name,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching category or products:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
