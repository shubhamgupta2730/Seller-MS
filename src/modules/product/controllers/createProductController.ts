import { Request, Response } from 'express';
import { Product, Seller } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const createProduct = async (req: CustomRequest, res: Response) => {
  const { name, description, price, stock, bundleId, categoryId } = req.body;

  const sellerId = req.user?.userId;

  try {
    const newProduct = new Product({
      sellerId,
      name,
      description,
      price,
      stock,
      bundleId,
      categoryId,
    });

    await newProduct.save();

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error });
  }
};
