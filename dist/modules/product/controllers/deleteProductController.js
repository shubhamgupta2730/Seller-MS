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
exports.deleteProduct = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../../../models/index");
const categoryModel_1 = __importDefault(require("../../../models/categoryModel"));
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { productId } = req.query;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (typeof productId !== 'string' ||
        !mongoose_1.default.Types.ObjectId.isValid(productId)) {
        console.log('Invalid product ID format:', productId);
        return res.status(400).json({ message: 'Invalid product ID format' });
    }
    if (!sellerId) {
        console.log('Unauthorized request: Missing seller ID');
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const productObjectId = new mongoose_1.default.Types.ObjectId(productId);
        const product = yield index_1.Product.findOne({
            _id: productObjectId,
            sellerId: sellerId,
            isDeleted: false,
        });
        if (!product) {
            console.log('Product not found or unauthorized:', productId);
            return res
                .status(404)
                .json({ message: 'Product not found or unauthorized' });
        }
        product.isDeleted = true;
        yield product.save();
        const result = yield index_1.Bundle.updateMany({ 'products.productId': productObjectId }, { $pull: { products: { productId: productObjectId } } });
        const bundles = yield index_1.Bundle.find({
            'products.productId': productObjectId,
        });
        for (const bundle of bundles) {
            let totalMRP = 0;
            // Recalculate total MRP
            for (const product of bundle.products) {
                const prod = yield index_1.Product.findById(product.productId);
                if (prod && prod.MRP) {
                    totalMRP += prod.MRP;
                }
            }
            // Apply the discount to calculate the new selling price
            let sellingPrice = totalMRP;
            if (bundle.discount) {
                sellingPrice = totalMRP - totalMRP * (bundle.discount / 100);
            }
            bundle.MRP = totalMRP;
            bundle.sellingPrice = sellingPrice;
            yield bundle.save();
        }
        if (product.categoryId) {
            yield categoryModel_1.default.updateOne({ _id: product.categoryId }, { $pull: { productIds: productObjectId } });
        }
        // Remove the productID from the Discount model
        yield discountModel_1.default.updateMany({ productIds: productId }, { $pull: { productIds: productId } });
        res.status(200).json({
            message: 'Product removed successfully',
        });
    }
    catch (error) {
        console.log('Error occurred:', error);
        res.status(500).json({ message: 'Failed to delete product', error });
    }
});
exports.deleteProduct = deleteProduct;
