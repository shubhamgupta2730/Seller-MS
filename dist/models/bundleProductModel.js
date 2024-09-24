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
const bundleProductSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    MRP: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    discount: { type: Number, required: true },
    adminDiscount: { type: Number, default: 0 },
    products: [
        {
            productId: {
                type: mongoose_1.default.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
        },
    ],
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin' },
    discountId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Discount', default: null },
    createdBy: {
        id: { type: mongoose_1.default.Types.ObjectId, required: true },
        role: { type: String, enum: ['seller', 'admin'], required: true },
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    blockedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
exports.default = mongoose_1.default.model('Bundle', bundleProductSchema);
