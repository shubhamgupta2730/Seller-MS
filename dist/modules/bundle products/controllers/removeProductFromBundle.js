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
exports.removeProductFromBundle = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../../../models/index");
const removeProductFromBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { bundleId } = req.query;
    const { productId } = req.body;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!sellerId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!bundleId ||
        typeof bundleId !== 'string' ||
        !mongoose_1.default.Types.ObjectId.isValid(bundleId)) {
        return res.status(400).json({ message: 'Invalid bundle ID format' });
    }
    if (!productId || !mongoose_1.default.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid product ID format' });
    }
    try {
        // Find the existing bundle
        const bundle = yield index_1.Bundle.findOne({
            _id: bundleId,
            isActive: true,
            isBlocked: false,
            isDeleted: false,
        });
        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        if (((_b = bundle.sellerId) === null || _b === void 0 ? void 0 : _b.toString()) !== sellerId) {
            return res
                .status(403)
                .json({ message: 'Unauthorized to update this bundle' });
        }
        // Check if the product exists in the bundle
        const productIndex = bundle.products.findIndex((p) => p.productId.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in bundle' });
        }
        // Remove the product from the bundle
        bundle.products.splice(productIndex, 1);
        // Recalculate total MRP and selling price
        let totalMRP = 0;
        const productPriceMap = {};
        const productNameMap = {};
        // Find all remaining products to calculate MRP and get names
        for (const p of bundle.products) {
            const prod = yield index_1.Product.findById(p.productId);
            if (prod) {
                productPriceMap[p.productId.toString()] = prod.sellingPrice;
                productNameMap[p.productId.toString()] = prod.name;
                totalMRP += prod.MRP;
            }
        }
        // Update the bundle's pricing
        let sellingPrice = totalMRP;
        if (bundle.discount !== undefined) {
            sellingPrice = totalMRP - (totalMRP * bundle.discount) / 100;
        }
        bundle.MRP = totalMRP;
        bundle.sellingPrice = sellingPrice;
        yield bundle.save();
        // Update the product to remove the bundle ID reference
        yield index_1.Product.updateMany({ _id: productId }, { $pull: { bundleIds: new mongoose_1.default.Types.ObjectId(bundleId) } } // Use $pull to remove bundleId from array
        );
        const response = {
            _id: bundle._id,
            name: bundle.name,
            description: bundle.description,
            MRP: bundle.MRP,
            sellingPrice: bundle.sellingPrice,
            discount: bundle.discount,
            products: bundle.products.map((p) => ({
                productId: p.productId.toString(),
                productName: productNameMap[p.productId.toString()] || 'Unknown Product',
            })),
        };
        res
            .status(200)
            .json({ message: 'Product removed successfully', bundle: response });
    }
    catch (error) {
        console.error('Failed to remove product from bundle', error);
        res
            .status(500)
            .json({ message: 'Failed to remove product from bundle', error });
    }
});
exports.removeProductFromBundle = removeProductFromBundle;
