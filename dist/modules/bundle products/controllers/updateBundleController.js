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
exports.updateBundle = void 0;
const index_1 = require("../../../models/index");
const mongoose_1 = __importDefault(require("mongoose"));
const updateBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { bundleId } = req.query;
    const { name, description, products } = req.body;
    const sellerAuthId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!sellerAuthId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!bundleId || typeof bundleId !== 'string') {
        return res.status(400).json({ message: 'Invalid bundle ID' });
    }
    try {
        // Find the existing bundle
        const bundle = yield index_1.BundleProduct.findById(bundleId);
        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        // Track old product IDs
        const oldProductIds = bundle.products.map(p => p.productId.toString());
        // Check if the seller owns all the products in the update
        if (products && Array.isArray(products)) {
            // Check that all products are owned by the seller
            const productIds = products.map((product) => product.productId);
            const ownedProducts = yield index_1.Product.find({
                _id: { $in: productIds },
                sellerAuthId: sellerAuthId,
            });
            if (ownedProducts.length !== productIds.length) {
                return res.status(403).json({ message: 'Unauthorized to update one or more products' });
            }
            // Update products in the bundle
            bundle.products = products;
            // Calculate the total price of the updated bundle
            let totalPrice = 0;
            for (const { productId, quantity } of products) {
                const product = yield index_1.Product.findById(productId);
                if (product) {
                    totalPrice += product.price * quantity;
                }
            }
            bundle.price = totalPrice;
            // Update products in the database
            const updatedProductIds = products.map(p => p.productId.toString());
            // Remove the old bundle ID from products
            yield index_1.Product.updateMany({ _id: { $in: oldProductIds.map(id => new mongoose_1.default.Types.ObjectId(id)) } }, { $pull: { bundles: new mongoose_1.default.Types.ObjectId(bundleId) } });
            // Add the new bundle ID to products
            yield index_1.Product.updateMany({ _id: { $in: updatedProductIds.map(id => new mongoose_1.default.Types.ObjectId(id)) } }, { $addToSet: { bundles: new mongoose_1.default.Types.ObjectId(bundleId) } });
        }
        if (name)
            bundle.name = name;
        if (description)
            bundle.description = description;
        yield bundle.save();
        res.status(200).json({
            message: 'Bundle updated successfully',
            bundle,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update bundle', error });
    }
});
exports.updateBundle = updateBundle;
