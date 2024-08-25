import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Bundle, Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'seller' | 'admin'; // Assuming role is needed to determine permissions
  };
}

interface ProductInfo {
  productId: string;
}

export const updateBundle = async (req: CustomRequest, res: Response) => {
  const { bundleId } = req.query;
  const {
    name,
    description,
    products,
    discount,
  }: Partial<{
    name: string;
    description: string;
    products: ProductInfo[];
    discount: number;
  }> = req.body;

  const { userId: sellerId, role } = req.user || {};

  if (!sellerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (
    !bundleId ||
    typeof bundleId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(bundleId)
  ) {
    return res.status(400).json({ message: 'Invalid bundle ID format' });
  }

  try {
    // Find the existing bundle
    const bundle = await Bundle.findOne({
      _id: bundleId,
      isActive: true,
      isBlocked: false,
      isDeleted: false,
    });

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if the user is authorized to update the bundle
    if (role === 'seller' && bundle.sellerId?.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to update this bundle' });
    }

    // Initialize price and name maps for products
    const productPriceMap: { [key: string]: number } = {};
    const productNameMap: { [key: string]: string } = {};

    // Handle products update
    if (products && Array.isArray(products) && products.length > 0) {
      const existingProductIds = new Set(
        bundle.products.map((p) => p.productId.toString())
      );
      const newProducts = products.filter(
        (p) => !existingProductIds.has(p.productId)
      );

      const duplicateProducts = products.filter((p) =>
        existingProductIds.has(p.productId)
      );

      if (duplicateProducts.length > 0) {
        return res.status(400).json({
          message: 'Some of the provided product IDs are already in the bundle',
        });
      }

      // Ensure the seller owns all the new products and they are active
      const ownedProducts = await Product.find({
        _id: {
          $in: [
            ...newProducts.map((p) => new mongoose.Types.ObjectId(p.productId)),
            ...bundle.products.map((p) => p.productId),
          ],
        },
        sellerId: new mongoose.Types.ObjectId(sellerId),
        isActive: true,
        isDeleted: false,
        isBlocked: false,
      });

      // Populate the product price and name maps
      ownedProducts.forEach((op) => {
        const productId = (op._id as mongoose.Types.ObjectId).toString();
        productPriceMap[productId] = op.MRP;
        productNameMap[productId] = op.name;
      });

      // Update bundle's products array
      bundle.products = [
        ...bundle.products.filter(
          (p) =>
            !newProducts.some((np) => np.productId === p.productId.toString())
        ),
        ...newProducts.map((p) => ({
          productId: new mongoose.Types.ObjectId(p.productId),
        })),
      ];

      // Calculate total MRP
      let totalMRP: number = 0;
      bundle.products.forEach((p) => {
        const productId = p.productId.toString();
        totalMRP += productPriceMap[productId] || 0;
      });

      // Calculate the selling price based on the updated discount
      let sellingPrice: number = totalMRP;
      if (discount !== undefined) {
        sellingPrice = totalMRP - (totalMRP * discount) / 100;
      }

      bundle.MRP = totalMRP;
      bundle.sellingPrice = sellingPrice;
    }

    // Update other fields if provided
    if (name) bundle.name = name;
    if (description) bundle.description = description;
    if (discount !== undefined) bundle.discount = discount;

    // Update product references in the database if products were updated
    if (products && Array.isArray(products) && products.length > 0) {
      await Product.updateMany(
        {
          _id: {
            $in: products.map((p) => new mongoose.Types.ObjectId(p.productId)),
          },
        },
        { $push: { bundleIds: new mongoose.Types.ObjectId(bundleId) } }
      );

      // Optionally, remove old bundle references from products that are no longer in the bundle
      const currentProductIds = products.map((p) => p.productId);
      const removedProductIds = bundle.products
        .filter((p) => !currentProductIds.includes(p.productId.toString()))
        .map((p) => p.productId.toString());

      if (removedProductIds.length > 0) {
        await Product.updateMany(
          {
            _id: {
              $in: removedProductIds.map(
                (id) => new mongoose.Types.ObjectId(id)
              ),
            },
          },
          { $pull: { bundleIds: new mongoose.Types.ObjectId(bundleId) } }
        );
      }
    }

    await bundle.save();

    // Generate the response with product names
    const response = {
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      MRP: bundle.MRP,
      sellingPrice: bundle.sellingPrice,
      discount: bundle.discount,
      products: bundle.products.map((p) => ({
        productId: p.productId.toString(),
      })),
    };

    res.status(200).json({
      message: 'Bundle updated successfully',
      bundle: response,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update bundle', error });
  }
};
