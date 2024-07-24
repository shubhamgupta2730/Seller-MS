import { Schema, model, Document } from 'mongoose';

interface ISeller extends Document {
  userId: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  dob: Date | null;
  gender: string;
  shopName: string;
  shopDescription?: string;
  address: string;
  shopContactNumber: string;
  businessLicense: string;
  taxId: string;
  website?: string;
}

const SellerSchema = new Schema<ISeller>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
    },
    shopName: { type: String, required: true },
    shopDescription: { type: String },
    address: { type: String, required: true },
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
