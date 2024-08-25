import { Schema, model, Document } from 'mongoose';

// Extend the ICategory interface to include timestamps
export interface ICategory extends Document {
  name: string;
  description: string;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  productIds: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
// Define the schema with timestamps
const categorySchema: Schema<ICategory> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    productIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
);

const Category = model<ICategory>('Category', categorySchema);

export default Category;
