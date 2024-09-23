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
exports.createBundle = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../../../models/index");
const createBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, description, products, } = req.body;
    const sellerAuthId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!sellerAuthId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        // Check if products is an array and not empty
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                message: 'Products array is required and should not be empty',
            });
        }
        // Extract product IDs from the products array
        const productIds = products.map((p) => new mongoose_1.default.Types.ObjectId(p.productId));
        // Fetch the products owned by the seller
        const ownedProducts = yield index_1.Product.find({
            _id: { $in: productIds },
            sellerAuthId: new mongoose_1.default.Types.ObjectId(sellerAuthId),
        }).exec();
        // Check if the fetched products match the provided product IDs
        if (ownedProducts.length !== productIds.length) {
            return res
                .status(403)
                .json({ message: 'Unauthorized to bundle one or more products' });
        }
        let totalPrice = 0;
        const productPriceMap = {};
        // Store prices of owned products
        ownedProducts.forEach((product) => {
            const productId = product._id.toString();
            productPriceMap[productId] = product.price;
        });
        // Calculate total price and validate quantities
        for (const productInfo of products) {
            const productId = productInfo.productId;
            const quantity = productInfo.quantity;
            if (!productPriceMap[productId]) {
                return res
                    .status(404)
                    .json({ message: `Product with ID ${productId} not found` });
            }
            // Add to total price
            totalPrice += productPriceMap[productId] * quantity;
        }
        // Create new bundle
        const newBundle = new index_1.BundleProduct({
            name,
            description,
            price: totalPrice,
            finalPrice: totalPrice,
            products: products.map((p) => ({
                productId: new mongoose_1.default.Types.ObjectId(p.productId),
                quantity: p.quantity,
            })),
            sellerAuthId: new mongoose_1.default.Types.ObjectId(sellerAuthId),
        });
        // Save new bundle
        const savedBundle = yield newBundle.save();
        // Update products to reference the new bundle
        yield index_1.Product.updateMany({ _id: { $in: productIds } }, { $push: { bundles: savedBundle._id } } // Assuming 'bundles' is an array field in Product schema
        );
        res.status(201).json({
            message: 'Bundle created successfully',
            bundle: savedBundle,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create bundle', error });
    }
});
exports.createBundle = createBundle;
