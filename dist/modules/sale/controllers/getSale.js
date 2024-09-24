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
exports.getSellerSale = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const saleModel_1 = __importDefault(require("../../../models/saleModel"));
const getSellerSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const saleId = req.query.saleId;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    // Validate Sale ID
    if (!saleId || !mongoose_1.default.Types.ObjectId.isValid(saleId)) {
        return res.status(400).json({
            message: 'Invalid sale ID.',
        });
    }
    try {
        const now = new Date();
        // Find the sale with the given saleId and ensure it belongs to the seller
        const sale = (yield saleModel_1.default.findOne({
            _id: saleId,
            isDeleted: false,
            $or: [
                { startDate: { $lte: now }, endDate: { $gte: now } }, // Ongoing sales
                { startDate: { $gt: now } }, // Upcoming sales
            ],
        })
            .populate({
            path: 'categories.categoryId',
            select: 'name',
        })
            .populate({
            path: 'products.productId',
            select: 'name sellingPrice categoryId MRP',
        })
            .populate({
            path: 'bundles.bundleId',
            select: 'name sellingPrice products',
            populate: {
                path: 'products.productId',
                select: 'name',
            },
        }));
        if (!sale) {
            return res.status(404).json({
                message: 'Sale not found, or no ongoing/upcoming sale found.',
            });
        }
        const formattedSale = {
            id: sale._id,
            name: sale.name,
            description: sale.description,
            startDate: sale.startDate.toLocaleDateString(),
            endDate: sale.endDate.toLocaleDateString(),
            isActive: sale.isActive,
            categories: sale.categories.map((cat) => {
                const category = cat.categoryId;
                const productsInCategory = sale.products
                    .map((p) => p.productId)
                    .filter((product) => product.categoryId.equals(category._id))
                    .map((product) => ({
                    productId: product._id,
                    productName: product.name,
                    MRP: product.MRP,
                    sellingPrice: product.sellingPrice,
                }));
                return {
                    categoryId: category._id,
                    categoryName: category.name || 'Unknown',
                    discount: cat.discount,
                    products: productsInCategory,
                };
            }),
            bundles: sale.bundles.map((bundle) => {
                const populatedBundle = bundle.bundleId;
                return {
                    bundleId: populatedBundle._id,
                    bundleName: populatedBundle.name,
                    sellingPrice: populatedBundle.sellingPrice,
                    products: populatedBundle.products.map((product) => ({
                        productId: product.productId._id,
                        productName: product.productId.name,
                    })),
                };
            }),
        };
        return res.status(200).json({
            message: 'Sale details fetched successfully',
            sale: formattedSale,
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({
            message: 'Failed to retrieve sale details',
            error: err.message,
        });
    }
});
exports.getSellerSale = getSellerSale;
