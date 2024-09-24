"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SellerSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
    },
    shopName: { type: String, required: true },
    shopDescription: { type: String },
    shopContactNumber: { type: String, required: true },
    businessLicense: { type: String, required: true },
    taxId: { type: String, required: true },
    website: { type: String },
}, {
    timestamps: true,
});
const Seller = (0, mongoose_1.model)('Seller', SellerSchema);
exports.default = Seller;
