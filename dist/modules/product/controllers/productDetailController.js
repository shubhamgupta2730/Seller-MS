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
exports.getProductDetails = void 0;
const index_1 = require("../../../models/index");
const getProductDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { productId } = req.query;
    const sellerAuthId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!productId) {
        console.log('Product ID is missing from the request');
        return res.status(400).json({ message: 'Product ID is required' });
    }
    if (!sellerAuthId) {
        console.log('Seller ID is missing from the request');
        return res.status(400).json({ message: 'Seller ID is missing' });
    }
    try {
        const product = yield index_1.Product.findById(productId)
            .populate({
            path: 'discounts',
            select: 'discountType discountValue startDate endDate',
        })
            .populate({
            path: 'bundleId',
            select: 'bundleName bundleDescription',
        });
        if (!product) {
            console.log('Product not found');
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.sellerAuthId.toString() !== sellerAuthId) {
            console.log('Unauthorized access attempt');
            return res
                .status(403)
                .json({ message: 'You are not authorized to view this product' });
        }
        console.log('Product found and access authorized');
        res.status(200).json({ product });
    }
    catch (error) {
        console.log('Error occurred:', error);
        res.status(500).json({ message: 'Failed to retrieve product', error });
    }
});
exports.getProductDetails = getProductDetails;
