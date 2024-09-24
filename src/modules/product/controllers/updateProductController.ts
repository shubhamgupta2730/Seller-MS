import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../../../models/index';
import Category from '../../../models/categoryModel';
import { upload } from '../../../config/cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';

// Custom Request interface to include user information
interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

// Update product controller
export const updateProduct = [
  // Middleware to handle file uploads, expecting 'images' field
  upload.array('images'), // Limiting to 5 images, adjust as needed

  async (req: CustomRequest, res: Response) => {
    const { productId } = req.query;
    let { name, description, MRP, discount, quantity, categoryId } = req.body;
    const sellerId = req.user?.userId;
    const images = req.files as Express.Multer.File[];

    // Validate productId format
    if (typeof productId !== 'string' || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findOne({
      _id: productId,
      sellerId: sellerId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    // Check if a product with the same name already exists
    if (name) {
      const existingProduct = await Product.findOne({ name, sellerId });
      if (existingProduct) {
        return res.status(400).json({ message: 'A product with this name already exists' });
      }
    }

    // Validate and convert numeric fields (MRP, discount, quantity) from strings to numbers
    if (MRP !== undefined) {
      MRP = parseFloat(MRP);
      if (isNaN(MRP) || MRP <= 0) {
        return res.status(400).json({ message: 'Invalid MRP: MRP must be a positive number' });
      }
    }

    if (quantity !== undefined) {
      quantity = parseInt(quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
      }
    }

    if (discount !== undefined) {
      discount = parseFloat(discount);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        return res.status(400).json({
          message: 'Invalid discount: Discount must be a number between 0 and 100',
        });
      }
    }

    // Validate categoryId
    if (categoryId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID format' });
      }

      // Check if the category exists and is active
      const category = await Category.findOne({ _id: categoryId, isActive: true });
      if (!category) {
        return res.status(400).json({ message: 'Category does not exist or is not active' });
      }
    }

    // Prepare update object
    const updateFields: any = { updatedAt: new Date() };

    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (MRP !== undefined) updateFields.MRP = MRP;
    if (quantity !== undefined) updateFields.quantity = quantity;
    if (discount !== undefined) updateFields.discount = discount;
    if (categoryId !== undefined) updateFields.categoryId = categoryId;

    // Calculate selling price based on MRP and discount if either is updated
    if (MRP !== undefined || discount !== undefined) {
      const MRPValue = MRP || product.MRP;
      const discountValue = discount !== undefined ? discount : product.discount;
      updateFields.sellingPrice = MRPValue - MRPValue * (discountValue / 100);
    }

    // Handle image upload and validation
    if (images && images.length > 0) {
      try {
        const imageUrls: string[] = [];

        // Delete old images from Cloudinary if they exist
        if (product.images && product.images.length > 0) { // Use the correct property name
          for (const oldImageUrl of product.images) { // Use the correct property name
            const publicId = oldImageUrl.split('/').pop()?.split('.')[0]; // Extract public ID from URL
            await cloudinaryV2.uploader.destroy(`products/${publicId}`); // Delete old image
          }
        }

        for (const image of images) {
          // Validate image type
          const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
          if (!allowedFormats.includes(image.mimetype)) {
            return res.status(400).json({
              message: 'Invalid image format. Only JPG, JPEG, and PNG are allowed.',
            });
          }

          // Upload image to Cloudinary
          const uploadResult = await cloudinaryV2.uploader.upload(image.path, {
            folder: 'products',
            public_id: `${Date.now()}-${image.originalname}`,
            resource_type: 'image',
          });

          imageUrls.push(uploadResult.secure_url); // Store the image URL
        }

        // Update product's image URLs only if images were uploaded successfully
        updateFields.images = imageUrls; // Use the correct property name
      } catch (error) {
        return res.status(500).json({ message: 'Image upload failed', error });
      }
    }

    try {
      // Update the product in the database
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productId, sellerId: sellerId, isActive: true },
        { $set: updateFields },
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found or not active' });
      }

      // Handle category updates
      if (product.categoryId && product.categoryId.toString() !== categoryId?.toString()) {
        await Category.updateOne(
          { _id: product.categoryId },
          { $pull: { productIds: updatedProduct._id } }
        );
      }

      if (categoryId) {
        await Category.updateOne(
          { _id: categoryId },
          { $addToSet: { productIds: updatedProduct._id } }
        );
      }

      // Return updated product details, including the image URLs
      res.status(200).json({
        message: 'Product updated successfully',
        product: updatedProduct,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update product', error });
    }
  },
];
