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
exports.createProduct = void 0;
const index_1 = require("../../../models/index");
const mongoose_1 = __importDefault(require("mongoose"));
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, description, price, quantity, bundleId, categoryId } = req.body;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    // Ensure the seller is authenticated
    if (!sellerId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Validate required fields
    if (!name || !price || quantity === undefined) {
        return res.status(400).json({
            message: 'Missing required fields: name, price, and quantity are required',
        });
    }
    // Ensure price and quantity are positive numbers
    if (price <= 0 || quantity < 0) {
        return res.status(400).json({
            message: 'Invalid price or quantity value: price must be greater than 0 and quantity cannot be negative',
        });
    }
    // Ensure bundleId and categoryId are valid MongoDB ObjectIDs if provided
    if (bundleId && !mongoose_1.default.Types.ObjectId.isValid(bundleId)) {
        return res.status(400).json({ message: 'Invalid bundleId' });
    }
    if (categoryId && !mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ message: 'Invalid categoryId' });
    }
    try {
        const newProduct = new index_1.Product({
            sellerAuthId: sellerId,
            name,
            description,
            price,
            finalPrice: price,
            quantity,
            bundleId,
            categoryId,
        });
        yield newProduct.save();
        res.status(201).json({
            message: 'Product created successfully',
            product: newProduct,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create product', error });
    }
});
exports.createProduct = createProduct;
