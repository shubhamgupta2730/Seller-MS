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
exports.createBundle = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../../../models/index");
const userModel_1 = __importDefault(require("../../../models/userModel"));
const createBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { name, description, products, discount, } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    if (!userId || !userRole) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Validate name, description, discount, and products array
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Invalid name: Name is required' });
    }
    if (typeof description !== 'string' || description.trim() === '') {
        return res
            .status(400)
            .json({ message: 'Invalid description: Description is required' });
    }
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
        return res.status(400).json({
            message: 'Invalid discount: Discount must be a number between 0 and 100',
        });
    }
    if (!Array.isArray(products) || products.length === 0) {
        return res
            .status(400)
            .json({ message: 'Products are required to create a bundle' });
    }
    try {
        // Validate product IDs
        const invalidProductIds = products.filter((id) => !mongoose_1.default.Types.ObjectId.isValid(id));
        if (invalidProductIds.length > 0) {
            return res.status(400).json({
                message: `Invalid product IDs: ${invalidProductIds.join(', ')}`,
            });
        }
        // Fetch the active products owned by the seller/admin that are not deleted or blocked
        const query = {
            _id: { $in: products },
            isActive: true,
            isDeleted: false,
            isBlocked: false,
        };
        if (userRole === 'seller') {
            query.sellerId = new mongoose_1.default.Types.ObjectId(userId);
        }
        const ownedProducts = yield index_1.Product.find(query).exec();
        // Check if the fetched products match the provided product IDs
        if (ownedProducts.length !== products.length) {
            return res.status(403).json({
                message: 'Unauthorized to bundle one or more products or products are not active, deleted, or blocked',
            });
        }
        // Calculate total MRP
        const totalMRP = ownedProducts.reduce((sum, product) => sum + product.MRP, 0);
        // Calculate selling price based on discount percentage
        let sellingPrice = totalMRP;
        if (discount) {
            sellingPrice = totalMRP - totalMRP * (discount / 100);
        }
        // Create new bundle
        const newBundle = new index_1.Bundle({
            name,
            description,
            MRP: totalMRP,
            sellingPrice,
            discount,
            products: products.map((productId) => ({
                productId: new mongoose_1.default.Types.ObjectId(productId),
            })),
            sellerId: userRole === 'seller' ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
            adminId: userRole === 'admin' ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
            createdBy: {
                id: new mongoose_1.default.Types.ObjectId(userId),
                role: userRole,
            },
            isActive: true,
            isDeleted: false,
            isBlocked: false,
        });
        const savedBundle = yield newBundle.save();
        // Update products to reference the new bundle
        yield index_1.Product.updateMany({ _id: { $in: products } }, { $push: { bundleIds: savedBundle._id } });
        // Fetch the seller's name
        const seller = yield userModel_1.default.findById(userId).select('firstName lastName');
        const sellerName = seller ? `${seller.firstName} ${seller.lastName}` : null;
        // Generate the response with product names
        const response = {
            _id: savedBundle._id,
            name: savedBundle.name,
            description: savedBundle.description,
            MRP: savedBundle.MRP,
            sellingPrice: savedBundle.sellingPrice,
            discount: savedBundle.discount,
            products: ownedProducts.map((p) => ({
                productId: p._id,
                productName: p.name,
                MRP: p.MRP,
            })),
            createdBy: {
                _id: userId,
                name: sellerName,
            },
            createdAt: savedBundle.createdAt,
            updatedAt: savedBundle.updatedAt,
        };
        res.status(201).json({
            message: 'Bundle created successfully',
            bundle: response,
        });
    }
    catch (error) {
        console.error('Failed to create bundle', error);
        res.status(500).json({ message: 'Failed to create bundle', error });
    }
});
exports.createBundle = createBundle;
