import mongoose, { Schema, Document, Types } from 'mongoose';

interface CreatedBy {
  id: mongoose.Types.ObjectId;
  role: 'seller' | 'admin';
}

interface IBundleProduct extends Document {
  name: string;
  description: string;
  MRP: number;
  sellingPrice: number;
  discount: number;
  adminDiscount?: number;
  discountId: Types.ObjectId | null;
  products: { productId: mongoose.Types.ObjectId }[];
  sellerId?: Schema.Types.ObjectId;
  adminId?: Schema.Types.ObjectId;
  createdBy: CreatedBy;
  isActive: boolean;
  isDeleted: boolean;
  isBlocked: boolean;
  blockedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bundleProductSchema = new Schema<IBundleProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  MRP: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  discount: { type: Number, required: true },
  adminDiscount: { type: Number, default: 0 },
  products: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    },
  ],
  sellerId: { type: Schema.Types.ObjectId, ref: 'User' },
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
  discountId: { type: Schema.Types.ObjectId, ref: 'Discount', default: null },
  createdBy: {
    id: { type: mongoose.Types.ObjectId, required: true },
    role: { type: String, enum: ['seller', 'admin'], required: true },
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  blockedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBundleProduct>('Bundle', bundleProductSchema);
