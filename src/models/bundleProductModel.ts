import mongoose, { Schema, Document } from 'mongoose';

interface IBundleProduct extends Document {
  name: string;
  description: string;
  MRP: number;
  sellingPrice: number;
  discountPercentage: number;
  products: { productId: mongoose.Types.ObjectId; quantity: number }[];
  sellerId: Schema.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bundleProductSchema = new Schema<IBundleProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  MRP: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  discountPercentage: { type: Number, required: true },
  products: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: { type: Number, required: true },
    },
  ],
  sellerId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  isActive: { type: Boolean, default: true }, // Added isActive field
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBundleProduct>(
  'BundleProduct',
  bundleProductSchema
);
