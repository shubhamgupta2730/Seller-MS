import mongoose, { Schema, Document, Types } from 'mongoose';

interface IBundleProduct extends Document {
  name: string;
  description: string;
  price: number;
  finalPrice: number;
  products: Schema.Types.ObjectId[];
  discounts: Types.ObjectId[] | null;
  sellerAuthId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bundleProductSchema = new Schema<IBundleProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  finalPrice: { type: Number, default: 0 },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product', required: true }],
  discounts: [{ type: Schema.Types.ObjectId, ref: 'Discount' }],
  sellerAuthId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBundleProduct>(
  'BundleProduct',
  bundleProductSchema
);
