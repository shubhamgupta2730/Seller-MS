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
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../../../models/index");
const updateBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { bundleId } = req.query;
    const { name, description, products, discount, } = req.body;
    const { userId: sellerId, role } = req.user || {};
    if (!sellerId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!bundleId ||
        typeof bundleId !== 'string' ||
        !mongoose_1.default.Types.ObjectId.isValid(bundleId)) {
        return res.status(400).json({ message: 'Invalid bundle ID format' });
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
        // Check if the user is authorized to update the bundle
        if (role === 'seller' && ((_a = bundle.sellerId) === null || _a === void 0 ? void 0 : _a.toString()) !== sellerId) {
            return res
                .status(403)
                .json({ message: 'Unauthorized to update this bundle' });
        }
        // Initialize price and name maps for products
        const productPriceMap = {};
        const productNameMap = {};
        // Handle products update
        if (products && Array.isArray(products) && products.length > 0) {
            const existingProductIds = new Set(bundle.products.map((p) => p.productId.toString()));
            const newProducts = products.filter((p) => !existingProductIds.has(p.productId));
            const duplicateProducts = products.filter((p) => existingProductIds.has(p.productId));
            if (duplicateProducts.length > 0) {
                return res.status(400).json({
                    message: 'Some of the provided product IDs are already in the bundle',
                });
            }
            // Ensure the seller owns all the new products and they are active
            const ownedProducts = yield index_1.Product.find({
                _id: {
                    $in: [
                        ...newProducts.map((p) => new mongoose_1.default.Types.ObjectId(p.productId)),
                        ...bundle.products.map((p) => p.productId),
                    ],
                },
                sellerId: new mongoose_1.default.Types.ObjectId(sellerId),
                isActive: true,
                isDeleted: false,
                isBlocked: false,
            });
            // Populate the product price and name maps
            ownedProducts.forEach((op) => {
                const productId = op._id.toString();
                productPriceMap[productId] = op.MRP;
                productNameMap[productId] = op.name;
            });
            // Update bundle's products array
            bundle.products = [
                ...bundle.products.filter((p) => !newProducts.some((np) => np.productId === p.productId.toString())),
                ...newProducts.map((p) => ({
                    productId: new mongoose_1.default.Types.ObjectId(p.productId),
                })),
            ];
            // Calculate total MRP
            let totalMRP = 0;
            bundle.products.forEach((p) => {
                const productId = p.productId.toString();
                totalMRP += productPriceMap[productId] || 0;
            });
            // Calculate the selling price based on the updated discount
            let sellingPrice = totalMRP;
            if (discount !== undefined) {
                sellingPrice = totalMRP - (totalMRP * discount) / 100;
            }
            bundle.MRP = totalMRP;
            bundle.sellingPrice = sellingPrice;
        }
        // Update other fields if provided
        if (name)
            bundle.name = name;
        if (description)
            bundle.description = description;
        if (discount !== undefined)
            bundle.discount = discount;
        // Update product references in the database if products were updated
        if (products && Array.isArray(products) && products.length > 0) {
            yield index_1.Product.updateMany({
                _id: {
                    $in: products.map((p) => new mongoose_1.default.Types.ObjectId(p.productId)),
                },
            }, { $push: { bundleIds: new mongoose_1.default.Types.ObjectId(bundleId) } });
            // Optionally, remove old bundle references from products that are no longer in the bundle
            const currentProductIds = products.map((p) => p.productId);
            const removedProductIds = bundle.products
                .filter((p) => !currentProductIds.includes(p.productId.toString()))
                .map((p) => p.productId.toString());
            if (removedProductIds.length > 0) {
                yield index_1.Product.updateMany({
                    _id: {
                        $in: removedProductIds.map((id) => new mongoose_1.default.Types.ObjectId(id)),
                    },
                }, { $pull: { bundleIds: new mongoose_1.default.Types.ObjectId(bundleId) } });
            }
        }
        yield bundle.save();
        // Generate the response with product names
        const response = {
            _id: bundle._id,
            name: bundle.name,
            description: bundle.description,
            MRP: bundle.MRP,
            sellingPrice: bundle.sellingPrice,
            discount: bundle.discount,
            products: bundle.products.map((p) => ({
                productId: p.productId.toString(),
            })),
        };
        res.status(200).json({
            message: 'Bundle updated successfully',
            bundle: response,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update bundle', error });
    }
});
exports.updateBundle = updateBundle;
