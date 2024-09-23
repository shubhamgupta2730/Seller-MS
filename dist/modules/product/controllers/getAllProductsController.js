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
exports.getAllSellerProducts = void 0;
const productModel_1 = __importDefault(require("../../../models/productModel"));
const getAllSellerProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!sellerId) {
        console.log('Seller ID is missing from the request');
        return res.status(400).json({ message: 'Seller ID is missing' });
    }
    const { search = '', sortBy = 'name', sortOrder = 'asc', page = 1, limit = 5, } = req.query;
    // Create filter for search
    const filter = {
        sellerAuthId: sellerId,
        name: { $regex: search, $options: 'i' }, // Case-insensitive search
    };
    // Create sort criteria
    const sortCriteria = {
        [sortBy]: sortOrder === 'desc' ? -1 : 1,
    };
    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    try {
        // Fetch products for the seller with filters, sorting, and pagination
        const products = yield productModel_1.default.find(filter)
            .populate({
            path: 'discounts',
            select: 'discountType discountValue startDate endDate',
        })
            .populate({
            path: 'bundleId',
            select: 'bundleName bundleDescription',
        })
            .sort(sortCriteria)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);
        if (!products.length) {
            console.log('No products found for this seller');
            return res
                .status(404)
                .json({ message: 'No products found for this seller' });
        }
        // Get total count of products for pagination
        const totalProducts = yield productModel_1.default.countDocuments(filter);
        res.status(200).json({
            products,
            pagination: {
                total: totalProducts,
                page: pageNum,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        console.log('Error occurred:', error);
        res.status(500).json({ message: 'Failed to retrieve products', error });
    }
});
exports.getAllSellerProducts = getAllSellerProducts;
