import mongoose, { Schema, Document } from 'mongoose';

interface IProductAnalytics extends Document {
  productId: Schema.Types.ObjectId;
  sellerId: Schema.Types.ObjectId;
  views: number;
  clicks: number;
  purchases: number;
  createdAt: Date;
  updatedAt: Date;
}

const productAnalyticsSchema = new Schema<IProductAnalytics>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  views: { type: Number, required: true },
  clicks: { type: Number, required: true },
  purchases: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IProductAnalytics>(
  'ProductAnalytics',
  productAnalyticsSchema
);
