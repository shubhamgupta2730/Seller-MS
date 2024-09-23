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
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const getAllBundleProductSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    // Extract and cast query parameters
    const { search, sortBy, sortOrder = 'asc', page = '1', limit = '10', } = req.query;
    // Type cast and handle defaults
    const searchQuery = typeof search === 'string' ? search : '';
    const sortByField = typeof sortBy === 'string' ? sortBy : 'createdAt';
    const sortOrderValue = typeof sortOrder === 'string' ? sortOrder : 'asc';
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    // Create a filter object
    const filter = { sellerAuthId: sellerId };
    // Add search filter if search query is provided
    if (searchQuery) {
        filter.name = { $regex: searchQuery, $options: 'i' }; // Case-insensitive search
    }
    // Determine the sorting criteria
    const sortCriteria = {};
    if (sortByField) {
        sortCriteria[sortByField] = sortOrderValue === 'desc' ? -1 : 1;
    }
    try {
        // Fetch bundles with pagination and sorting
        const bundles = yield bundleProductModel_1.default.find(filter)
            .populate('products', 'price') // Populate products with price information
            .populate('discounts', 'discountType discountValue startDate endDate') // Populate discounts information
            .sort(sortCriteria)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);
        // Check if bundles are found
        if (!bundles.length) {
            return res
                .status(404)
                .json({ message: 'No bundles found for this seller' });
        }
        // Get total count of bundles for pagination
        const totalBundles = yield bundleProductModel_1.default.countDocuments(filter);
        // Return the bundles with pagination info
        res.status(200).json({
            bundles,
            pagination: {
                total: totalBundles,
                page: pageNum,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: 'Failed to retrieve bundle product sales', error });
    }
});
exports.getAllBundleProductSales = getAllBundleProductSales;
