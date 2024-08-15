import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../../../models/index';
import Category from '../../../models/categoryModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const updateProduct = async (req: CustomRequest, res: Response) => {
  const { productId } = req.query;
  const { name, description, MRP, discount, quantity, categoryId } = req.body;
  const sellerId = req.user?.userId;

  // Validate productId format
  if (
    typeof productId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  const product = await Product.findOne({
    _id: productId,
    sellerId: sellerId,
    isDeleted: false,
  });

  if (!product) {
    console.log('Product not found or unauthorized:', productId);
    return res
      .status(404)
      .json({ message: 'Product not found or unauthorized' });
  }

  // Check if a product with the same name already exists
  if (name) {
    const existingProduct = await Product.findOne({ name, sellerId });
    if (existingProduct) {
      return res
        .status(400)
        .json({ message: 'A product with this name already exists' });
    }
  }

  // Validate sellerId
  if (!sellerId) {
    return res.status(400).json({ message: 'Seller ID is required' });
  }

  // Prepare update object
  const updateFields: any = {};

  // Validate and add fields to the update object if they exist
  if (name !== undefined) updateFields.name = name;
  if (description !== undefined) updateFields.description = description;
  if (MRP !== undefined) {
    if (typeof MRP !== 'number' || MRP <= 0) {
      return res.status(400).json({
        message: 'Invalid MRP: MRP must be a positive number',
      });
    }
    updateFields.MRP = MRP;
  }
  if (quantity !== undefined) {
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({
        message: 'Invalid quantity',
      });
    }
    updateFields.quantity = quantity;
  }
  if (discount !== undefined) {
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
      return res.status(400).json({
        message:
          'Invalid discount: Discount must be a number between 0 and 100',
      });
    }
    updateFields.discount = discount;
  }
  if (categoryId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }

    // Check if the category exists and is active
    const category = await Category.findOne({
      _id: categoryId,
      isActive: true,
    });
    if (!category) {
      return res
        .status(400)
        .json({ message: 'Category does not exist or is not active' });
    }
    updateFields.categoryId = categoryId;
  }

  // Calculate selling price based on MRP and discount if either is updated
  if (updateFields.MRP !== undefined || updateFields.discount !== undefined) {
    const MRPValue =
      updateFields.MRP || (await Product.findById(productId))?.MRP;
    const discountValue =
      updateFields.discount !== undefined
        ? updateFields.discount
        : (await Product.findById(productId))?.discount;

    updateFields.sellingPrice = MRPValue - MRPValue * (discountValue / 100);
  }

  // Update updatedAt field
  updateFields.updatedAt = new Date();

  try {
    // Find the current product
    const currentProduct = await Product.findOne({
      _id: productId,
      sellerId: sellerId,
      isActive: true,
    });

    if (!currentProduct) {
      return res
        .status(404)
        .json({ message: 'Product not found or not active' });
    }

    // Update the product
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, sellerId: sellerId, isActive: true },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ message: 'Product not found or not active' });
    }

    // Handle category updates
    if (
      currentProduct.categoryId &&
      currentProduct.categoryId.toString() !==
        updateFields.categoryId?.toString()
    ) {
      // Remove product ID from old category
      await Category.updateOne(
        { _id: currentProduct.categoryId },
        { $pull: { productIds: updatedProduct._id } }
      );
    }

    if (updateFields.categoryId) {
      // Add product ID to new category
      await Category.updateOne(
        { _id: updateFields.categoryId },
        { $addToSet: { productIds: updatedProduct._id } }
      );
    }

    // Get category name
    const category = await Category.findOne({
      _id: updatedProduct.categoryId,
    }).select('name');
    const categoryName = category?.name || 'Unknown Category';

    // Select only necessary fields to return
    const responseProduct = {
      _id: updatedProduct._id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      MRP: updatedProduct.MRP,
      sellingPrice: updatedProduct.sellingPrice,
      quantity: updatedProduct.quantity,
      discount: updatedProduct.discount,
      categoryId: updatedProduct.categoryId,
      categoryName: categoryName,
    };

    res.status(200).json({
      message: 'Product updated successfully',
      product: responseProduct,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error });
  }
};
