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
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { productId } = req.query;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (typeof productId !== 'string' ||
        !mongoose_1.default.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid product ID format' });
    }
    if (!sellerId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        // Find the product by ID and ensure it belongs to the seller
        const product = yield index_1.Product.findOne({
            _id: productId,
            sellerAuthId: sellerId,
        });
        if (!product) {
            return res
                .status(404)
                .json({ message: 'Product not found or unauthorized' });
        }
        // Delete associated discounts
        yield index_1.Discount.deleteMany({ productId: product._id });
        // Delete the product
        yield index_1.Product.deleteOne({ _id: productId });
        // Remove the product from bundles
        yield index_1.BundleProduct.updateMany({ products: productId }, { $pull: { products: productId } });
        res.status(200).json({
            message: 'Product and associated discounts deleted successfully and removed from bundles',
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete product', error });
    }
});
exports.deleteProduct = deleteProduct;
