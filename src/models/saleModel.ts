import mongoose, { Schema, Document } from 'mongoose';

interface ISaleCategory {
  categoryId: mongoose.Types.ObjectId;
  discount: number;
}

interface ISaleProduct {
  productId: mongoose.Types.ObjectId;
}

interface ISaleBundle {
  bundleId: mongoose.Types.ObjectId;
}

interface ISale extends Document {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  categories: ISaleCategory[];
  products: ISaleProduct[];
  bundles: ISaleBundle[];
  isActive: boolean;
  isDeleted: boolean;
  discountApplied: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const saleCategorySchema = new Schema<ISaleCategory>({
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  discount: { type: Number, required: true },
});

const saleProductSchema = new Schema<ISaleProduct>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
});

const saleBundleSchema = new Schema<ISaleBundle>({
  bundleId: {
    type: Schema.Types.ObjectId,
    ref: 'Bundle',
    required: true,
  },
});

const saleSchema = new Schema<ISale>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  categories: [saleCategorySchema],
  products: [saleProductSchema],
  bundles: [saleBundleSchema],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  discountApplied: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISale>('Sale', saleSchema);
