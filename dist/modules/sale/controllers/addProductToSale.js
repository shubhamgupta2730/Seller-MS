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
exports.sellerAddProductsToSale = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const saleModel_1 = __importDefault(require("../../../models/saleModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
// Function to apply discounts to newly added products and bundles
const applyDiscountsToNewItems = (sale, newProducts, newBundles) => __awaiter(void 0, void 0, void 0, function* () {
    for (const saleProduct of newProducts) {
        const product = yield productModel_1.default.findById(saleProduct.productId);
        if (!product) {
            console.error(`Product not found for ID: ${saleProduct.productId}`);
            continue;
        }
        const productCategoryId = String(product.categoryId);
        const saleCategory = sale.categories.find((cat) => {
            return productCategoryId === String(cat.categoryId._id);
        });
        if (!saleCategory) {
            console.warn(`No matching sale category found for product category ID: ${productCategoryId}`);
            continue;
        }
        const discount = saleCategory.discount || 0;
        const discountedPrice = product.sellingPrice * (1 - discount / 100);
        const roundedDiscountedPrice = Math.round(discountedPrice);
        product.sellingPrice = roundedDiscountedPrice;
        product.adminDiscount = discount;
        yield product.save();
    }
    for (const saleBundle of newBundles) {
        const bundle = yield bundleProductModel_1.default.findById(saleBundle.bundleId);
        if (bundle) {
            let maxDiscount = 0;
            let totalSellingPrice = 0;
            for (const bundleProduct of bundle.products) {
                const product = yield productModel_1.default.findById(bundleProduct.productId);
                if (product) {
                    const saleCategory = sale.categories.find((cat) => {
                        return String(product.categoryId) === String(cat.categoryId._id);
                    });
                    const discount = saleCategory ? saleCategory.discount : 0;
                    if (discount > maxDiscount) {
                        maxDiscount = discount;
                    }
                    totalSellingPrice += product.sellingPrice;
                }
            }
            const discountedBundlePrice = totalSellingPrice * (1 - maxDiscount / 100);
            const roundedDiscountedBundlePrice = Math.round(discountedBundlePrice);
            bundle.sellingPrice = roundedDiscountedBundlePrice;
            bundle.adminDiscount = maxDiscount;
            yield bundle.save();
        }
    }
});
const sellerAddProductsToSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const saleId = req.query.saleId;
    const { products } = req.body;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!saleId || !mongoose_1.default.Types.ObjectId.isValid(saleId)) {
        return res.status(400).json({
            message: 'Invalid sale ID.',
        });
    }
    if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
            message: 'The products field must be a non-empty array.',
        });
    }
    try {
        const sale = yield saleModel_1.default.findOne({ _id: saleId, isDeleted: false }).populate('categories.categoryId');
        if (!sale) {
            return res.status(404).json({
                message: 'Sale not found or has been deleted.',
            });
        }
        const now = new Date();
        if (sale.endDate <= now) {
            return res.status(400).json({
                message: 'Cannot add products to a sale that has ended.',
            });
        }
        const existingProductIds = sale.products.map((p) => p.productId.toString());
        const existingBundleIds = sale.bundles.map((b) => b.bundleId.toString());
        const validProducts = [];
        const validBundles = [];
        for (const product of products) {
            const productId = product.productId;
            if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    message: `Invalid product ID: ${productId}.`,
                });
            }
            if (existingProductIds.includes(productId)) {
                return res.status(400).json({
                    message: `Product with ID ${productId} is already added to this sale.`,
                });
            }
            const productData = yield productModel_1.default.findOne({
                _id: productId,
                isActive: true,
                isDeleted: false,
                isBlocked: false,
                createdBy: sellerId,
            });
            if (!productData) {
                return res.status(400).json({
                    message: `Product with ID ${productId} is either inactive, deleted, blocked, or not owned by you.`,
                });
            }
            const saleCategory = sale.categories.find((cat) => { var _a; return (_a = productData.categoryId) === null || _a === void 0 ? void 0 : _a.equals(cat.categoryId._id); });
            if (!saleCategory) {
                return res.status(400).json({
                    message: `Product with ID ${productId} does not belong to any of the sale's categories.`,
                });
            }
            const saleProduct = {
                productId: new mongoose_1.default.Types.ObjectId(productId),
            };
            validProducts.push(saleProduct);
            const bundlesContainingProduct = yield bundleProductModel_1.default.find({
                'products.productId': productId,
                isActive: true,
                isDeleted: false,
                isBlocked: false,
                createdBy: sellerId,
            });
            for (const bundle of bundlesContainingProduct) {
                const bundleId = bundle._id;
                if (existingBundleIds.includes(bundleId.toString())) {
                    continue;
                }
                const saleBundle = {
                    bundleId,
                };
                validBundles.push(saleBundle);
            }
        }
        sale.products = sale.products.concat(validProducts);
        sale.bundles = sale.bundles.concat(validBundles);
        yield sale.save();
        if (sale.startDate <= now) {
            // Apply discounts only if the sale is ongoing
            yield applyDiscountsToNewItems(sale, validProducts, validBundles);
        }
        return res.status(200).json({
            message: 'Products and related bundles added to the sale successfully.',
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({
            message: 'Failed to add products or bundles to sale',
            error: err.message,
        });
    }
});
exports.sellerAddProductsToSale = sellerAddProductsToSale;
