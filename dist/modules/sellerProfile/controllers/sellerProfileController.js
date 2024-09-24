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
exports.createSellerProfile = void 0;
const sellerModel_1 = __importDefault(require("../../../models/sellerModel"));
const createSellerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { shopName, shopDescription, shopContactNumber, businessLicense, taxId, website, } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return res.status(400).json({ message: 'User ID not found' });
    }
    if (!shopName || !shopDescription) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (typeof shopName !== 'string' || typeof shopDescription !== 'string') {
        return res.status(400).json({ message: 'Invalid data types' });
    }
    if (shopName.length < 3) {
        return res
            .status(400)
            .json({ message: 'Shop name must be at least 3 characters long' });
    }
    if (shopDescription.length < 10) {
        return res.status(400).json({
            message: 'Shop description must be at least 10 characters long',
        });
    }
    if (shopContactNumber && typeof shopContactNumber !== 'number') {
        return res.status(400).json({ message: 'Invalid contact number format' });
    }
    if (shopContactNumber && !/^\d{10,15}$/.test(shopContactNumber)) {
        return res
            .status(400)
            .json({ message: 'Contact number must be between 10 and 15 digits' });
    }
    if (businessLicense && typeof businessLicense !== 'string') {
        return res.status(400).json({ message: 'Invalid business license format' });
    }
    if (taxId && typeof taxId !== 'string') {
        return res.status(400).json({ message: 'Invalid tax ID format' });
    }
    if (website && typeof website !== 'string') {
        return res.status(400).json({ message: 'Invalid website format' });
    }
    if (website && !/^https?:\/\/[\w\-]+\.[\w\-]+/.test(website)) {
        return res.status(400).json({ message: 'Invalid website URL' });
    }
    try {
        // Check if the seller profile already exists
        const existingSeller = yield sellerModel_1.default.findOne({ userId: userId });
        if (existingSeller) {
            return res.status(400).json({
                message: 'Seller profile already exists',
            });
        }
        const newSeller = new sellerModel_1.default({
            userId: userId,
            shopName,
            shopDescription,
            shopContactNumber,
            businessLicense,
            taxId,
            website,
        });
        yield newSeller.save();
        res.status(201).json({
            message: 'Seller profile created successfully',
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create seller profile', error });
    }
});
exports.createSellerProfile = createSellerProfile;
