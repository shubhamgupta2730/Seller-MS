"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDiscount = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const updateDiscount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Extract discountId from query and ensure it is a string
    const discountId = req.query.discountId;
    const { discountType, discountValue, startDate, endDate } = req.body;
    const sellerAuthId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!sellerAuthId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Ensure discountId is a valid string and handle cases where it might be undefined
    if (!discountId || !mongoose_1.default.Types.ObjectId.isValid(discountId)) {
        return res.status(400).json({ message: 'Invalid discount ID' });
    }
    try {
        const discount = yield discountModel_1.default.findById(discountId);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }
        if (discount.sellerAuthId.toString() !== sellerAuthId) {
            return res.status(403).json({ message: 'You do not own this discount' });
        }
        // Update the discount fields
        discount.discountType = discountType;
        discount.discountValue = discountValue;
        discount.startDate = startDate;
        discount.endDate = endDate;
        yield discount.save();
        let entity;
        if (discount.productId) {
            entity = yield productModel_1.default.findById(discount.productId);
        }
        else if (discount.bundleId) {
            entity = yield bundleProductModel_1.default.findById(discount.bundleId);
        }
        if (entity) {
            // Ensure entity.discounts is not null
            const discountsArray = entity.discounts || []; // Default to empty array if null
            // Check if the discount is currently valid
            const currentDate = new Date();
            if (new Date(startDate) <= currentDate &&
                new Date(endDate) >= currentDate) {
                // Add discount if valid and not already present
                if (!discountsArray.includes(discount._id)) {
                    discountsArray.push(discount._id);
                }
            }
            else {
                // Remove discount if no longer valid
                entity.discounts = discountsArray.filter((id) => id.toString() !==
                    discount._id.toString());
            }
            // Recalculate final price
            entity.finalPrice = yield calculateFinalPrice(entity.price, entity.discounts);
            yield entity.save();
        }
        res.status(200).json({
            message: 'Discount updated successfully',
            discount,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update discount', error });
    }
});
exports.updateDiscount = updateDiscount;
const calculateFinalPrice = (price, discounts) => __awaiter(void 0, void 0, void 0, function* () {
    let finalPrice = price;
    const discountsArray = discounts || [];
    for (const discountId of discountsArray) {
        const discount = yield discountModel_1.default.findById(discountId);
        if (discount) {
            finalPrice = applyDiscount(finalPrice, discount.discountType, discount.discountValue);
        }
    }
    return finalPrice;
});
const applyDiscount = (price, discountType, discountValue) => {
    switch (discountType) {
        case 'percentage':
            return price - (price * discountValue) / 100;
        case 'fixed':
            return price - discountValue;
        default:
            return price;
    }
};
