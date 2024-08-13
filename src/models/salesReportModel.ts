import mongoose, { Schema, Document } from 'mongoose';

interface ISalesReport extends Document {
  productId: Schema.Types.ObjectId;
  sellerId: Schema.Types.ObjectId;
  quantitySold: number;
  totalRevenue: number;
  reportDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const salesReportSchema = new Schema<ISalesReport>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Auth', required: true },
  quantitySold: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  reportDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISalesReport>('SalesReport', salesReportSchema);
