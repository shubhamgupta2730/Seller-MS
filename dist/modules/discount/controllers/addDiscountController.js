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
exports.addDiscount = void 0;
const productModel_1 = __importDefault(require("../../../models/productModel"));
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const addDiscount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { productId, bundleId, discountType, discountValue, startDate, endDate, } = req.body;
    const sellerAuthId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    // Ensure that either productId or bundleId is passed, but not both
    if ((productId && bundleId) || (!productId && !bundleId)) {
        return res.status(400).json({
            message: 'Either productId or bundleId must be provided, but not both.',
        });
    }
    try {
        // Check if the discount is applied to a product or a bundle
        let entity;
        if (productId) {
            entity = yield productModel_1.default.findById(productId);
        }
        else if (bundleId) {
            entity = yield bundleProductModel_1.default.findById(bundleId);
        }
        if (!entity) {
            return res.status(404).json({ message: 'Product or Bundle not found.' });
        }
        if (entity.sellerAuthId.toString() !== sellerAuthId) {
            return res.status(403).json({ message: 'You do not have access.' });
        }
        const newDiscount = new discountModel_1.default({
            productId,
            bundleId,
            sellerAuthId,
            discountType,
            discountValue,
            startDate,
            endDate,
        });
        yield newDiscount.save();
        // Ensure entity.discounts is initialized
        if (!entity.discounts) {
            entity.discounts = [];
        }
        // Add the discount to the entity if valid
        const currentDate = new Date();
        if (new Date(startDate) <= currentDate &&
            new Date(endDate) >= currentDate) {
            entity.discounts.push(newDiscount._id);
            // Calculate the new final price
            entity.finalPrice = yield calculateFinalPrice(entity.price, entity.discounts, entity.products);
            yield entity.save();
        }
        res.status(201).json({
            message: 'Discount added successfully',
            discount: newDiscount,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to add discount', error });
    }
});
exports.addDiscount = addDiscount;
const calculateFinalPrice = (price, discounts, products) => __awaiter(void 0, void 0, void 0, function* () {
    let finalPrice = price;
    for (const discountId of discounts) {
        const discount = yield discountModel_1.default.findById(discountId);
        if (discount) {
            finalPrice = applyDiscount(finalPrice, discount.discountType, discount.discountValue);
        }
    }
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
