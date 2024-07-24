import mongoose, { Schema, Document } from 'mongoose';

interface IBundleProduct extends Document {
  name: string;
  description: string;
  price: number;
  products: Schema.Types.ObjectId[];
  sellerAuthId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bundleProductSchema = new Schema<IBundleProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product', required: true }],
  sellerAuthId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBundleProduct>(
  'BundleProduct',
  bundleProductSchema
);
