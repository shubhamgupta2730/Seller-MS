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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProduct = void 0;
const index_1 = require("../../../models/index");
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { productId } = req.query;
    const { name, description, price, quantity, bundleId, categoryId } = req.body;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!productId || typeof productId !== 'string') {
        console.log('Product ID is missing or invalid');
        return res.status(400).json({ message: 'Product ID is required' });
    }
    if (!sellerId) {
        console.log('Seller ID is missing from the request');
        return res.status(400).json({ message: 'Seller ID is required' });
    }
    try {
        // Update the product
        const updatedProduct = yield index_1.Product.findOneAndUpdate({ _id: productId, sellerAuthId: sellerId }, { name, description, price, quantity, categoryId }, { new: true });
        if (!updatedProduct) {
            console.log('Product not found or unauthorized');
            return res.status(404).json({ message: 'Product not found or unauthorized' });
        }
        if (bundleId) {
            // Ensure the bundleId is valid
            const bundle = yield index_1.BundleProduct.findById(bundleId);
            if (bundle) {
                // Update the bundle's total price
                let totalPrice = 0;
                for (const { productId, quantity } of bundle.products) {
                    const prod = yield index_1.Product.findById(productId);
                    if (prod) {
                        totalPrice += prod.price * quantity;
                    }
                }
                // Apply discounts
                const now = new Date();
                const activeDiscounts = yield index_1.Discount.find({
                    _id: { $in: bundle.discounts },
                    startDate: { $lte: now },
                    endDate: { $gte: now },
                });
                let finalPrice = totalPrice;
                for (const discount of activeDiscounts) {
                    if (discount.discountType === 'percentage') {
                        finalPrice -= (totalPrice * discount.discountValue) / 100;
                    }
                    else if (discount.discountType === 'fixed') {
                        finalPrice -= discount.discountValue;
                    }
                }
                // Update the bundle with the new final price
                yield index_1.BundleProduct.findByIdAndUpdate(bundle._id, { finalPrice });
            }
        }
        console.log('Product and bundle updated successfully');
        res.status(200).json({
            message: 'Product updated successfully',
            product: updatedProduct,
        });
    }
    catch (error) {
        console.log('Error occurred:', error);
        res.status(500).json({ message: 'Failed to update product', error });
    }
});
exports.updateProduct = updateProduct;
