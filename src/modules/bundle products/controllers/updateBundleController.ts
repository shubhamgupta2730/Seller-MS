import { Request, Response } from 'express';
import { BundleProduct, Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const updateBundle = async (req: CustomRequest, res: Response) => {
  const { bundleId } = req.query;
  const { name, description, products } = req.body;
  const sellerAuthId = req.user?.userId;

  if (!sellerAuthId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Find the existing bundle
    const bundle = await BundleProduct.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if the seller owns all the products in the update
    if (products) {
      // Check that all products are owned by the seller
      const productIds = products.map(
        (product: { productId: string }) => product.productId
      );
      const ownedProducts = await Product.find({
        _id: { $in: productIds },
        sellerId: sellerAuthId,
      });

      if (ownedProducts.length !== productIds.length) {
        return res
          .status(403)
          .json({ message: 'Unauthorized to update one or more products' });
      }

      // Update products in the bundle
      bundle.products = products;

      // Calculate the total price of the updated bundle
      let totalPrice = 0;
      for (const { productId, quantity } of products) {
        const product = await Product.findById(productId);
        if (product) {
          totalPrice += product.price * quantity;
        }
      }
      bundle.price = totalPrice;
    }

    if (name) bundle.name = name;
    if (description) bundle.description = description;


    await bundle.save();
    res.status(200).json({
      message: 'Bundle updated successfully',
      bundle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update bundle', error });
  }
};
