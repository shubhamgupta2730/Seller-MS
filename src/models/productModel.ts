import mongoose, { Schema, Document, Types } from 'mongoose';

interface IProduct extends Document {
  name: string;
  description: string;
  MRP: number;
  sellingPrice: number;
  quantity: number;
  discount: number;
  categoryId: Types.ObjectId | null;
  sellerId: Types.ObjectId;
  bundleId: Types.ObjectId;
  isActive: boolean;
  isBlocked: boolean;
  isDeleted: boolean;
  blockedBy: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  MRP: { type: Number, required: true },
  sellingPrice: { type: Number, default: 0 },
  quantity: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bundleId: { type: Schema.Types.ObjectId, ref: 'Bundle', default: null },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  blockedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IProduct>('Product', productSchema);
