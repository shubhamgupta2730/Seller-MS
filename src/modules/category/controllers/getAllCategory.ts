import { Request, Response } from 'express';
import Category from '../../../models/categoryModel';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const {
      search,
      sortBy = 'name',
      order = 'asc',
      page = 1,
      limit = 10,
    } = req.query;

    const searchQuery = search
      ? { name: { $regex: search as string, $options: 'i' } }
      : {};

    const sortOrder = order === 'asc' ? 1 : -1;

    const categories = await Category.aggregate([
      { $match: { ...searchQuery, isActive: true } },
      { $sort: { [sortBy as string]: sortOrder } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
      { $project: { name: 1, description: 1 } },
    ]);

    const totalCategories = await Category.countDocuments({
      ...searchQuery,
      isActive: true,
    });
    const totalPages = Math.ceil(totalCategories / Number(limit));

    res.json({
      categories,
      pagination: {
        totalCategories,
        totalPages,
        currentPage: Number(page),
        pageSize: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
