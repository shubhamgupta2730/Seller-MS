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
exports.getSellerSalesAnalytics = void 0;
const moment_1 = __importDefault(require("moment"));
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const getSellerSalesAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { period, startDate: queryStartDate, endDate: queryEndDate, } = req.query;
        const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!sellerId) {
            return res.status(400).json({ message: 'Seller ID is missing' });
        }
        let startDate;
        let endDate = new Date(); // Default to current date and time
        const currentDate = new Date(); // Used for future date validation
        // Handle custom date range
        if (queryStartDate || queryEndDate) {
            // Validate that both startDate and endDate are provided
            if (!queryStartDate || !queryEndDate) {
                return res.status(400).json({
                    message: 'Both startDate and endDate must be provided for custom range',
                });
            }
            startDate = new Date(queryStartDate);
            endDate = new Date(queryEndDate);
            // Check if custom dates are valid
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({
                    message: 'Invalid date format. Please use a valid date string.',
                });
            }
            // Ensure that startDate is before endDate
            if (startDate > endDate) {
                return res.status(400).json({
                    message: 'startDate cannot be after endDate',
                });
            }
            // Ensure startDate is not in the future
            if (startDate > currentDate) {
                return res.status(400).json({
                    message: 'startDate cannot be in the future',
                });
            }
            // Ensure endDate is not in the future
            if (endDate > currentDate) {
                return res.status(400).json({
                    message: 'endDate cannot be in the future',
                });
            }
        }
        else {
            // Determine the start date based on the specified period
            switch (period) {
                case 'daily':
                    startDate = (0, moment_1.default)().startOf('day').toDate();
                    break;
                case 'weekly':
                    startDate = (0, moment_1.default)().startOf('week').toDate();
                    break;
                case 'monthly':
                    startDate = (0, moment_1.default)().startOf('month').toDate();
                    break;
                case 'yearly':
                    startDate = (0, moment_1.default)().startOf('year').toDate();
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid period specified' });
            }
            // Ensure startDate is not in the future for predefined periods
            if (startDate > currentDate) {
                return res.status(400).json({
                    message: 'Start date cannot be in the future for the selected period',
                });
            }
        }
        console.log(`Start Date: ${startDate}`);
        console.log(`End Date: ${endDate}`);
        // Get aggregated data
        const [totalSales, totalProductsSold, topSellingProduct] = yield Promise.all([
            orderModel_1.default.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                    },
                },
                { $unwind: '$items' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.productId',
                        foreignField: '_id',
                        as: 'productData',
                    },
                },
                { $unwind: '$productData' },
                {
                    $match: {
                        'productData.sellerId': new mongoose_1.default.Types.ObjectId(sellerId),
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: '$totalAmount' },
                    },
                },
            ]).exec(),
            getTotalProductsSoldBySeller(sellerId, startDate, endDate),
            getTopSellingProductBySeller(sellerId, startDate, endDate),
        ]);
        res.status(200).json({
            totalSales: ((_b = totalSales[0]) === null || _b === void 0 ? void 0 : _b.totalSales) || 0,
            totalProductsSold: ((_c = totalProductsSold[0]) === null || _c === void 0 ? void 0 : _c.totalQuantity) || 0,
            topSellingProduct: topSellingProduct[0] || null,
        });
    }
    catch (error) {
        console.error('Error fetching sales analytics:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getSellerSalesAnalytics = getSellerSalesAnalytics;
const getTotalProductsSoldBySeller = (sellerId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    const pipeline = [
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
            },
        },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.productId',
                foreignField: '_id',
                as: 'productData',
            },
        },
        { $unwind: '$productData' },
        {
            $match: {
                'productData.sellerId': new mongoose_1.default.Types.ObjectId(sellerId),
            },
        },
        {
            $group: {
                _id: null,
                totalQuantity: { $sum: '$items.quantity' },
            },
        },
    ];
    // Execute each stage separately for debugging
    let intermediateResult = yield orderModel_1.default.aggregate([pipeline[0]]).exec();
    console.log('After $match stage:', JSON.stringify(intermediateResult, null, 2));
    intermediateResult = yield orderModel_1.default.aggregate([pipeline[0], pipeline[1]]).exec();
    console.log('After $unwind stage:', JSON.stringify(intermediateResult, null, 2));
    intermediateResult = yield orderModel_1.default.aggregate([
        pipeline[0],
        pipeline[1],
        pipeline[2],
    ]).exec();
    console.log('After $lookup stage:', JSON.stringify(intermediateResult, null, 2));
    intermediateResult = yield orderModel_1.default.aggregate([
        pipeline[0],
        pipeline[1],
        pipeline[2],
        pipeline[3],
    ]).exec();
    console.log('After second $unwind stage:', JSON.stringify(intermediateResult, null, 2));
    intermediateResult = yield orderModel_1.default.aggregate([
        pipeline[0],
        pipeline[1],
        pipeline[2],
        pipeline[3],
        pipeline[4],
    ]).exec();
    console.log('After second $match stage:', JSON.stringify(intermediateResult, null, 2));
    intermediateResult = yield orderModel_1.default.aggregate([
        pipeline[0],
        pipeline[1],
        pipeline[2],
        pipeline[3],
        pipeline[4],
        pipeline[5],
    ]).exec();
    console.log('After $group stage:', JSON.stringify(intermediateResult, null, 2));
    // Execute the entire pipeline
    const result = yield orderModel_1.default.aggregate(pipeline).exec();
    console.log(`getTotalProductsSoldBySeller Result: ${JSON.stringify(result, null, 2)}`);
    return result;
});
const getTopSellingProductBySeller = (sellerId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield orderModel_1.default.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
            },
        },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.productId',
                foreignField: '_id',
                as: 'productData',
            },
        },
        { $unwind: '$productData' },
        {
            $match: {
                'productData.sellerId': new mongoose_1.default.Types.ObjectId(sellerId),
            },
        },
        {
            $group: {
                _id: {
                    productId: '$items.productId',
                    productName: '$productData.name',
                },
                totalQuantity: { $sum: '$items.quantity' },
            },
        },
        {
            $sort: { totalQuantity: -1 },
        },
        { $limit: 1 },
        {
            $project: {
                _id: 0,
                productId: '$_id.productId',
                productName: '$_id.productName',
                totalQuantity: 1,
            },
        },
    ]).exec();
    console.log(`getTopSellingProductBySeller Result: ${JSON.stringify(result)}`);
    return result;
});
