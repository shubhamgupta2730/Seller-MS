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
exports.removeSellerProductFromSale = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const saleModel_1 = __importDefault(require("../../../models/saleModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const removeSellerProductFromSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const saleId = req.query.saleId;
    const { productIds } = req.body;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    // Validate Sale ID
    if (!saleId || !mongoose_1.default.Types.ObjectId.isValid(saleId)) {
        return res.status(400).json({
            message: 'Invalid sale ID.',
        });
    }
    // Validate productIds
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
            message: 'The productIds field must be a non-empty array.',
        });
    }
    // Validate each productId
    for (const productId of productIds) {
        if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: `Invalid product ID: ${productId}.`,
            });
        }
    }
    try {
        // Find the sale
        const sale = yield saleModel_1.default.findOne({ _id: saleId, isDeleted: false }).populate('categories.categoryId');
        if (!sale) {
            return res.status(404).json({
                message: 'Sale not found or has been deleted.',
            });
        }
        // Check if the sale is ongoing or in the future
        const now = new Date();
        if (sale.endDate <= now) {
            return res.status(400).json({
                message: 'Cannot modify products in a sale that has ended.',
            });
        }
        const removedProducts = [];
        const notFoundProducts = [];
        const removedBundles = [];
        const updatedBundles = [];
        // Process each productId
        for (const productId of productIds) {
            // Find the product and ensure it belongs to the seller
            const product = yield productModel_1.default.findOne({
                _id: productId,
                createdBy: sellerId,
                isActive: true,
                isDeleted: false,
            });
            if (!product) {
                notFoundProducts.push(productId);
                continue;
            }
            const productIndex = sale.products.findIndex((p) => p.productId.toString() === productId);
            if (productIndex === -1) {
                // If the product is not in the sale
                notFoundProducts.push(productId);
                continue;
            }
            // Remove the product from the sale
            sale.products.splice(productIndex, 1);
            const saleCategory = sale.categories.find((cat) => { var _a; return (_a = product.categoryId) === null || _a === void 0 ? void 0 : _a.equals(cat.categoryId._id); });
            if (saleCategory) {
                // Calculate the original price before the discount was applied
                const discount = saleCategory.discount;
                const discountedPrice = product.sellingPrice;
                const originalPrice = discountedPrice / (1 - discount / 100);
                // Restore the original selling price
                product.sellingPrice = originalPrice;
                yield product.save();
            }
            removedProducts.push(productId);
            // Check for bundles containing this product and update/remove them
            const bundlesContainingProduct = yield bundleProductModel_1.default.find({
                'products.productId': productId,
                isActive: true,
                isDeleted: false,
            });
            for (const bundle of bundlesContainingProduct) {
                const bundleId = bundle._id;
                const productCount = bundle.products.length;
                // If the bundle contains only one product, remove the bundle from the sale
                if (productCount === 1) {
                    const bundleIndex = sale.bundles.findIndex((b) => b.bundleId.equals(bundleId));
                    if (bundleIndex !== -1) {
                        sale.bundles.splice(bundleIndex, 1);
                        removedBundles.push(bundleId.toString());
                    }
                }
                else {
                    // If the bundle contains more than one product, update the bundle's selling price
                    let totalMRP = 0;
                    let totalDiscountedPrice = 0;
                    for (const bundleProduct of bundle.products) {
                        if (bundleProduct.productId.toString() !== productId) {
                            const productInBundle = yield productModel_1.default.findOne({
                                _id: bundleProduct.productId,
                                isActive: true,
                                isDeleted: false,
                            });
                            if (productInBundle) {
                                const saleCategoryForBundleProduct = sale.categories.find((cat) => { var _a; return (_a = productInBundle.categoryId) === null || _a === void 0 ? void 0 : _a.equals(cat.categoryId._id); });
                                const bundleProductDiscount = saleCategoryForBundleProduct
                                    ? saleCategoryForBundleProduct.discount
                                    : 0;
                                const bundleProductDiscountedPrice = productInBundle.sellingPrice /
                                    (1 - bundleProductDiscount / 100);
                                totalMRP += productInBundle.MRP;
                                totalDiscountedPrice += bundleProductDiscountedPrice;
                            }
                        }
                    }
                    // Update the bundle's selling price with the original price (before the discount)
                    bundle.sellingPrice = totalDiscountedPrice;
                    yield bundle.save();
                    updatedBundles.push(bundleId.toString());
                }
            }
        }
        // Save the updated sale
        yield sale.save();
        // Response with the status of the removal process
        return res.status(200).json({
            message: 'Seller products removal process completed.',
            removedProducts,
            notFoundProducts,
            removedBundles,
            updatedBundles,
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({
            message: 'Failed to remove products from sale',
            error: err.message,
        });
    }
});
exports.removeSellerProductFromSale = removeSellerProductFromSale;
