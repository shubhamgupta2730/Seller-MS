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
exports.getCategoryById = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const categoryModel_1 = __importDefault(require("../../../models/categoryModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const getCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const categoryId = req.query.id;
        const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required' });
        }
        if (!sellerId) {
            return res
                .status(401)
                .json({ message: 'Unauthorized: Seller ID is required' });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid Category ID format' });
        }
        // Find the category by ID
        const category = yield categoryModel_1.default.findById(categoryId).select('name description isActive productIds');
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        if (!category.isActive) {
            return res.status(403).json({ message: 'No category found' });
        }
        if (!category.productIds || category.productIds.length === 0) {
            return res.status(200).json({
                _id: (_b = category._id) === null || _b === void 0 ? void 0 : _b.toString(),
                name: category.name,
                description: category.description,
                products: [],
            });
        }
        // Find all products associated with the seller in the category
        const products = yield productModel_1.default.find({
            _id: { $in: category.productIds },
            sellerId: new mongoose_1.default.Types.ObjectId(sellerId),
            isActive: true,
            isDeleted: false,
            isBlocked: false,
        }).select('name');
        if (products.length === 0) {
            console.log(`No products found for seller ID ${sellerId} in category ${categoryId}`);
        }
        const response = {
            _id: (_c = category._id) === null || _c === void 0 ? void 0 : _c.toString(),
            name: category.name,
            description: category.description,
            products: products.map((product) => {
                var _a;
                return ({
                    productId: (_a = product._id) === null || _a === void 0 ? void 0 : _a.toString(),
                    productName: product.name,
                });
            }),
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching category or products:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getCategoryById = getCategoryById;
