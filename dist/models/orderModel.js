"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const orderSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            productId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Product',
                required: false,
            },
            bundleId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Bundle',
                required: false,
            },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            name: { type: String, required: true },
            MRP: { type: Number, required: true },
        },
    ],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: [
            'pending',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'failed',
        ],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'failed'],
        default: 'unpaid',
    },
    paymentMethod: {
        type: String,
        enum: ['Card', 'COD'],
        required: false,
    },
    shippingAddress: {
        addressLine1: { type: String, required: false },
        addressLine2: { type: String, required: false },
        street: { type: String, required: false },
        city: { type: String, required: false },
        state: { type: String, required: false },
        postalCode: { type: String, required: false },
        country: { type: String, required: false },
    },
    stripePaymentIntentId: { type: String, required: false },
    stripePaymentMethodId: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    orderDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date, required: false },
    refundStatus: {
        type: String,
        enum: ['not_requested', 'requested', 'processing', 'completed', 'failed'],
        default: 'not_requested',
    },
    refundAmount: { type: Number, required: false },
    refundReason: { type: String, required: false },
    refundDate: { type: Date, required: false },
});
exports.default = mongoose_1.default.model('Order', orderSchema);
