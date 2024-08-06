import { Schema, model, Document, Types } from 'mongoose';

export interface IAddress {
  addressLine1: string;
  addressLine2: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IUser extends Document {
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: Date | null;
  gender: string;
  isActive: boolean;
  isBlocked: boolean;
  blockedBy: Types.ObjectId | null;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'email' | 'phone' | 'authenticator';
  role: 'user' | 'seller';
  address: IAddress;
}

const AddressSchema: Schema<IAddress> = new Schema({
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
});

const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    countryCode: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
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
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorMethod: {
      type: String,
      enum: ['email', 'phone', 'authenticator'],
    },
    role: {
      type: String,
      enum: ['user', 'seller'],
      required: true,
      default: 'user',
    },
    address: {
      type: AddressSchema,
    },
  },
  {
    timestamps: true,
  }
);

const User = model<IUser>('User', UserSchema);

export default User;
