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
exports.getBundleDetails = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../../../models/index");
const userModel_1 = __importDefault(require("../../../models/userModel"));
const getBundleDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { bundleId } = req.query;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!sellerId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!bundleId ||
        typeof bundleId !== 'string' ||
        !mongoose_1.default.Types.ObjectId.isValid(bundleId)) {
        return res.status(400).json({ message: 'Invalid bundle ID format' });
    }
    try {
        const bundle = (yield index_1.Bundle.findOne({
            _id: bundleId,
            sellerId: new mongoose_1.default.Types.ObjectId(sellerId),
            isActive: true,
            isDeleted: false,
        }).populate({
            path: 'products.productId',
            select: 'name MRP sellingPrice',
        }));
        if (!bundle) {
            return res
                .status(404)
                .json({ message: 'Bundle not found or unauthorized' });
        }
        // Fetch the seller's information
        const seller = yield userModel_1.default.findById(sellerId).select('firstName lastName');
        const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : null;
        const response = {
            _id: bundle._id,
            name: bundle.name,
            description: bundle.description,
            MRP: bundle.MRP,
            sellingPrice: bundle.sellingPrice,
            discount: bundle.discount,
            products: bundle.products.map((product) => ({
                productId: product.productId._id,
                name: product.productId.name,
                MRP: product.productId.MRP,
                sellingPrice: product.productId.sellingPrice,
                quantity: product.quantity,
            })),
            // createdBy: {
            //   _id: sellerId,
            //   name: sellerName,
            // },
            // createdAt: bundle.createdAt,
            // updatedAt: bundle.updatedAt,
        };
        res.status(200).json({
            message: 'Bundle retrieved successfully',
            bundle: response,
        });
    }
    catch (error) {
        console.error('Failed to retrieve bundle details', error);
        res
            .status(500)
            .json({ message: 'Failed to retrieve bundle details', error });
    }
});
exports.getBundleDetails = getBundleDetails;
