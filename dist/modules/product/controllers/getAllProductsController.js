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
const mongoose_1 = __importDefault(require("mongoose"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const getAllSellerProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!sellerId) {
        console.log('Seller ID is missing from the request');
        return res.status(400).json({ message: 'Seller ID is missing' });
    }
    const { search = '', sortBy = 'name', sortOrder = 'asc', page = 1, limit = 5, category = '', showBlocked = 'false', } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const showBlockedProducts = showBlocked === 'true';
    try {
        const matchStage = {
            sellerId: new mongoose_1.default.Types.ObjectId(sellerId),
            isActive: true,
            isDeleted: false,
            isBlocked: showBlockedProducts,
            name: { $regex: search, $options: 'i' },
        };
        if (category) {
            matchStage['category.name'] = { $regex: `^${category}$`, $options: 'i' }; // Exact match for category name
        }
        console.log('Match Stage:', matchStage);
        const products = yield productModel_1.default.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sellerId',
                    foreignField: '_id',
                    as: 'seller',
                },
            },
            {
                $unwind: {
                    path: '$seller',
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $match: matchStage },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    images: 1,
                    // description: 1,
                    MRP: 1,
                    sellingPrice: 1,
                    // quantity: 1,
                    discount: 1,
                    categoryId: '$category._id',
                    category: '$category.name',
                    // sellerName: {
                    //   $concat: ['$seller.firstName', ' ', '$seller.lastName']
                    // }
                },
            },
            { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
        ]);
        if (!products.length) {
            console.log('No products found for this seller');
            return res
                .status(404)
                .json({ message: 'No products found for this seller' });
        }
        const totalProducts = yield productModel_1.default.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $match: matchStage },
            {
                $count: 'total',
            },
        ]);
        const total = ((_b = totalProducts[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
        res.status(200).json({
            products,
            pagination: {
                total: total,
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
