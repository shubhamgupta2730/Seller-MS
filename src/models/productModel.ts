import mongoose, { Schema, Document, Types } from 'mongoose';

interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  finalPrice: number;
  stock: number;
  discounts: Types.ObjectId[] | null;
  bundleId: Types.ObjectId | null;
  categoryId: Types.ObjectId | null;
  sellerAuthId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  finalPrice: { type: Number, default: 0 },
  stock: { type: Number, required: true },
  discounts: [{ type: Schema.Types.ObjectId, ref: 'Discount' }],
  bundleId: {
    type: Schema.Types.ObjectId,
    ref: 'BundleProduct',
    default: null,
  },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  sellerAuthId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IProduct>('Product', productSchema);
