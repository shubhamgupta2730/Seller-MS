"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const discountSchema = new mongoose_1.Schema({
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    discount: { type: Number, required: true, min: 0, max: 100 },
    code: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin', required: true },
    type: {
        type: String,
        enum: ['sellingPrice', 'MRP'],
    },
    productIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
    bundleIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Bundle' }],
}, {
    timestamps: true,
});
// Middleware to set isActive based on current date
discountSchema.pre('save', function (next) {
    const now = new Date();
    this.isActive =
        this.startDate <= now &&
            this.endDate > now &&
            this.startDate < this.endDate;
    next();
});
const Discount = (0, mongoose_1.model)('Discount', discountSchema);
exports.default = Discount;
