import { Request, Response } from 'express';
import { BundleProduct, Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
  };
}

export const createBundle = async (req: CustomRequest, res: Response) => {
  const { name, description, products } = req.body; //  products to be an array of { productId, quantity }
  const sellerAuthId = req.user?.userId;

  if (!sellerAuthId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check if products is an array and not empty
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: 'Products array is required and should not be empty',
      });
    }

    // Extract product IDs from the products array
    const productIds = products.map((p: { productId: string }) => p.productId);

    // Fetch the products owned by the seller
    const ownedProducts = await Product.find({
      _id: { $in: productIds },
      sellerId: sellerAuthId,
    });

    // Check if the fetched products match the provided product IDs
    if (ownedProducts.length !== productIds.length) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to bundle one or more products' });
    }

    let totalPrice = 0;
    const productPriceMap: { [key: string]: number } = {};

    // Store prices of owned products
    for (const product of ownedProducts) {
      productPriceMap[product._id.toString()] = product.price;
    }

    // Calculate total price and validate quantities
    for (const productInfo of products) {
      const productId = productInfo.productId;
      const quantity = productInfo.quantity;

      if (!productPriceMap[productId]) {
        return res
          .status(404)
          .json({ message: `Product with ID ${productId} not found` });
      }

      if (quantity <= 0) {
        return res.status(400).json({
          message: `Invalid quantity ${quantity} for product ID ${productId}`,
        });
      
      // Add to total price
      totalPrice += productPriceMap[productId] * quantity;
    }


    const newBundle = new BundleProduct({
      name,
      description,
      price: totalPrice,
      products: products, // Storing products with quantities
      sellerAuthId,
    });

    await newBundle.save();
    res.status(201).json({
      message: 'Bundle created successfully',
      bundle: newBundle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create bundle', error });
  }
};
