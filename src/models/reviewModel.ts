import mongoose, { Document, Schema } from 'mongoose';

interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  bundleId?: mongoose.Types.ObjectId;
  rating: number;
  reviewText: string;
  images: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    bundleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bundle' },
    rating: { type: Number, required: true },
    reviewText: { type: String, required: false },
    images: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IReview>('Review', ReviewSchema);
