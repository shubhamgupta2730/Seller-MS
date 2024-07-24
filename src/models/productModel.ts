import mongoose, { Schema, Document, Types } from 'mongoose';

interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  discounts: Types.ObjectId[];
  bundleId: Types.ObjectId | null;
  categoryId: Types.ObjectId | null;
  sellerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  discounts: [{ type: Schema.Types.ObjectId, ref: 'Discount' }],
  bundleId: { type: Schema.Types.ObjectId, ref: 'BundleProduct', default: null },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IProduct>('Product', productSchema);
