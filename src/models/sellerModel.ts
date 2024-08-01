import { Schema, model, Document } from 'mongoose';

export interface ISeller extends Document {
  userId: Schema.Types.ObjectId;
  shopName: string;
  shopDescription?: string;
  shopContactNumber: string;
  businessLicense: string;
  taxId: string;
  website?: string;
}

const SellerSchema = new Schema<ISeller>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
    },
    shopName: { type: String, required: true },
    shopDescription: { type: String },
    shopContactNumber: { type: String, required: true },
    businessLicense: { type: String, required: true },
    taxId: { type: String, required: true },
    website: { type: String },
  },
  {
    timestamps: true,
  }
);

const Seller = model<ISeller>('Seller', SellerSchema);
export default Seller;
