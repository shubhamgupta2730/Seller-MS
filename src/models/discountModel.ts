import { Schema, Document, model, Types } from 'mongoose';

export interface IDiscount extends Document {
  startDate: Date;
  endDate: Date;
  discount: number;
  code: string;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  type: 'sellingPrice' | 'MRP';
  productIds: Types.ObjectId[];
  bundleIds: Types.ObjectId[];
}

const discountSchema = new Schema<IDiscount>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    discount: { type: Number, required: true, min: 0, max: 100 },
    code: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    type: {
      type: String,
      enum: ['sellingPrice', 'MRP'],
    },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    bundleIds: [{ type: Schema.Types.ObjectId, ref: 'Bundle' }],
  },
  {
    timestamps: true,
  }
);

// Middleware to set isActive based on current date
discountSchema.pre('save', function (next) {
  const now = new Date();
  this.isActive =
    this.startDate <= now &&
    this.endDate > now &&
    this.startDate < this.endDate;
  next();
});

const Discount = model<IDiscount>('Discount', discountSchema);

export default Discount;
