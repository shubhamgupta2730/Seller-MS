import { Request, Response } from 'express';
import { Product } from '../../../models/index';
import { createProductSchema } from '../../../utils/productValidations';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const createProduct = async (req: CustomRequest, res: Response) => {
  const { error, value } = createProductSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { name, description, MRP, discount, quantity, categoryId } = value;
  const sellerId = req.user?.userId;

  if (!sellerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
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

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error });
  }
};
