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
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../../../models/index");
const categoryModel_1 = __importDefault(require("../../../models/categoryModel"));
const cloudinary_1 = require("../../../config/cloudinary");
// Setup Cloudinary and multer as shown above...
exports.createProduct = [
    // Middleware to handle file uploads, expecting 'images' field
    cloudinary_1.upload.array('images', 5), // Limiting to 5 images, adjust as needed
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { name, description, productMRP, productDiscount, productQuantity, categoryId } = req.body;
        const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!sellerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!name || typeof name !== 'string') {
            return res
                .status(400)
                .json({ message: 'Invalid or missing product name' });
        }
        if (description !== undefined && typeof description !== 'string') {
            return res.status(400).json({ message: 'Invalid product description' });
        }
        const MRP = parseFloat(req.body.productMRP);
        if (!MRP || typeof MRP !== 'number' || MRP <= 0) {
            return res.status(400).json({ message: 'Invalid or missing MRP' });
        }
        const discount = parseFloat(req.body.productDiscount);
        if (discount === undefined ||
            typeof discount !== 'number' ||
            discount < 0 ||
            discount > 100) {
            return res.status(400).json({ message: 'Invalid discount' });
        }
        const quantity = parseFloat(req.body.productQuantity);
        if (!quantity ||
            typeof quantity !== 'number' ||
            !Number.isInteger(quantity) ||
            quantity <= 0) {
            return res.status(400).json({ message: 'Invalid or missing quantity' });
        }
        if (categoryId && !mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }
        try {
            // Check if a product with the same name already exists
            const existingProduct = yield index_1.Product.findOne({ name, sellerId });
            if (existingProduct) {
                return res
                    .status(400)
                    .json({ message: 'A product with this name already exists' });
            }
            let category = null;
            if (categoryId) {
                category = yield categoryModel_1.default.findOne({
                    _id: categoryId,
                    isActive: true,
                });
                if (!category) {
                    return res.status(400).json({ message: 'Category does not exist' });
                }
            }
            // Calculate the selling price based on the discount percentage
            const sellingPrice = MRP - MRP * (discount / 100);
            // Handle image uploads
            const images = [];
            if (req.files && Array.isArray(req.files)) {
                for (const file of req.files) {
                    images.push(file.path); // Cloudinary URL is stored in `path`
                }
            }
            if (images.length === 0) {
                return res
                    .status(400)
                    .json({ message: 'At least one image is required' });
            }
            const newProduct = new index_1.Product({
                sellerId,
                name,
                description,
                MRP,
                sellingPrice,
                quantity,
                discount,
                categoryId: categoryId || null,
                createdBy: sellerId,
                images, // Storing image URLs
            });
            // Save the new product to the database
            const savedProduct = yield newProduct.save();
            // If categoryId is provided, update the Category's productIds array
            if (categoryId && category) {
                category.productIds.push(savedProduct._id);
                yield category.save();
            }
            // Filter the response fields
            const response = {
                _id: savedProduct._id,
                name: savedProduct.name,
                description: savedProduct.description,
                MRP: savedProduct.MRP,
                sellingPrice: savedProduct.sellingPrice,
                quantity: savedProduct.quantity,
                discount: savedProduct.discount,
                categoryId: savedProduct.categoryId,
                images: savedProduct.images, // Including images in the response
            };
            res.status(201).json({
                message: 'Product created successfully',
                product: response,
            });
        }
        catch (error) {
            console.error('Failed to create product:', error);
            res.status(500).json({ message: 'Failed to create product', error });
        }
    }),
];
