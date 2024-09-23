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
exports.removeDiscount = void 0;
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const removeDiscount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const discountId = req.query.discountId;
    const sellerAuthId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!sellerAuthId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!discountId) {
        return res.status(400).json({ message: 'Discount ID is required' });
    }
    try {
        const discount = yield discountModel_1.default.findById(discountId);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }
        if (discount.sellerAuthId.toString() !== sellerAuthId) {
            return res.status(403).json({ message: 'You do not own this discount' });
        }
        // Delete the discount
        yield discountModel_1.default.findByIdAndDelete(discountId);
        let entity;
        if (discount.productId) {
            entity = yield productModel_1.default.findById(discount.productId);
            if (entity) {
                // Ensure entity.discounts is initialized
                entity.discounts = entity.discounts || [];
                // Remove the discount from the product's list
                entity.discounts = entity.discounts.filter((id) => id.toString() !== discountId);
                // Recalculate the final price
                entity.finalPrice = yield calculateFinalPrice(entity.price, entity.discounts);
                yield entity.save();
            }
        }
        else if (discount.bundleId) {
            entity = yield bundleProductModel_1.default.findById(discount.bundleId);
            if (entity) {
                // Ensure entity.discounts is initialized
                entity.discounts = entity.discounts || [];
                // Remove the discount from the bundle's list
                entity.discounts = entity.discounts.filter((id) => id.toString() !== discountId);
                // Recalculate the final price
                entity.finalPrice = yield calculateFinalPrice(entity.price, entity.discounts, entity.products // Include products for bundles
                );
                yield entity.save();
            }
        }
        res.status(200).json({ message: 'Discount deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete discount', error });
    }
});
exports.removeDiscount = removeDiscount;
const calculateFinalPrice = (price, discounts, products) => __awaiter(void 0, void 0, void 0, function* () {
    let finalPrice = price;
    for (const discountId of discounts) {
        const discount = yield discountModel_1.default.findById(discountId);
        if (discount) {
            finalPrice = applyDiscount(finalPrice, discount.discountType, discount.discountValue);
        }
    }
    // If products are present, recalculate price for quantities
    if (products) {
        for (const { productId, quantity } of products) {
            const product = yield productModel_1.default.findById(productId);
            if (product) {
                finalPrice += product.price * quantity;
            }
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
