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
exports.getAllBundleProductSales = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const getAllBundleProductSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    if (!userId || userRole !== 'seller') {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { search, sortBy, sortOrder = 'asc', page = '1', limit = '5', showBlocked = 'false', } = req.query;
    const searchQuery = typeof search === 'string' ? search : '';
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt';
    const sortOrderValue = typeof sortOrder === 'string' ? sortOrder : 'asc';
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const showBlockedProducts = showBlocked === 'true';
    const filter = {
        'createdBy.id': new mongoose_1.default.Types.ObjectId(userId),
        'createdBy.role': 'seller',
        isActive: true,
        isDeleted: false,
    };
    if (showBlockedProducts) {
        filter.isBlocked = true;
    }
    else {
        filter.isBlocked = false;
    }
    if (searchQuery) {
        filter.name = { $regex: searchQuery, $options: 'i' };
    }
    const sortCriteria = {};
    if (sortByField) {
        sortCriteria[sortByField] = sortOrderValue === 'desc' ? -1 : 1;
    }
    try {
        const aggregationPipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'productDetails',
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    MRP: 1,
                    sellingPrice: 1,
                    discount: 1,
                    isBlocked: 1,
                    products: {
                        $map: {
                            input: '$products',
                            as: 'product',
                            in: {
                                productId: '$$product.productId',
                                quantity: '$$product.quantity',
                                name: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: '$productDetails',
                                                as: 'detail',
                                                cond: { $eq: ['$$detail._id', '$$product.productId'] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            { $sort: sortCriteria },
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
        ];
        const bundles = yield bundleProductModel_1.default.aggregate(aggregationPipeline);
        const totalBundles = yield bundleProductModel_1.default.countDocuments(filter);
        if (!bundles.length) {
            return res
                .status(404)
                .json({ message: 'No bundles found for this seller' });
        }
        res.status(200).json({
            bundles: bundles.map((bundle) => ({
                _id: bundle._id,
                name: bundle.name,
                MRP: bundle.MRP,
                sellingPrice: bundle.sellingPrice,
                discount: bundle.discount,
            })),
            pagination: {
                total: totalBundles,
                page: pageNum,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve bundle product sales',
            error,
        });
    }
});
exports.getAllBundleProductSales = getAllBundleProductSales;
