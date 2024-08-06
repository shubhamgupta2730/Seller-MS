// controllers/categoryController.ts
import { Request, Response } from 'express';
import Category from '../../../models/categoryModel';

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.id as string;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    const category = await Category.findById(categoryId).select(
      'name description isActive'
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (!category.isActive) {
      return res.status(403).json({ message: 'NO category found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
