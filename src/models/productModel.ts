import mongoose, { Schema, Document } from 'mongoose';

interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  bundleId: Schema.Types.ObjectId;
  categoryId: Schema.Types.ObjectId;
  sellerId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  bundleId: {
    type: Schema.Types.ObjectId,
    ref: 'BundleProduct',
    required: false,
  },
  categoryId: { type: Schema.Types.ObjectId, required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IProduct>('Product', productSchema);
