import mongoose, { Schema, Document } from 'mongoose';

interface IDiscount extends Document {
  productId?: Schema.Types.ObjectId;
  bundleId?: Schema.Types.ObjectId;
  sellerAuthId: Schema.Types.ObjectId;
  discountType: string;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new Schema<IDiscount>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  bundleId: { type: Schema.Types.ObjectId, ref: 'BundleProduct' },
  sellerAuthId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  discountType: { type: String, required: true },
  discountValue: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IDiscount>('Discount', discountSchema);
