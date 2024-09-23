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
    const { firstName, lastName, dob, gender, shopName, shopDescription, address, shopContactNumber, businessLicense, taxId, website, } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return res.status(400).json({ message: 'User ID not found' });
    }
    if (!firstName || !lastName || !shopName || !shopDescription || !address) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (typeof firstName !== 'string' ||
        typeof lastName !== 'string' ||
        typeof shopName !== 'string' ||
        typeof shopDescription !== 'string' ||
        typeof address !== 'string') {
        return res.status(400).json({ message: 'Invalid data types' });
    }
    if (firstName.length < 2 || lastName.length < 2) {
        return res
            .status(400)
            .json({ message: 'Names must be at least 2 characters long' });
    }
    if (shopName.length < 3) {
        return res
            .status(400)
            .json({ message: 'Shop name must be at least 3 characters long' });
    }
    // Validate date of birth
    if (dob && !isValidDate(dob)) {
        return res.status(400).json({ message: 'Invalid date of birth format' });
    }
    // Validate contact number format
    if (shopContactNumber && !/^\+?[1-9]\d{1,14}$/.test(shopContactNumber)) {
        return res.status(400).json({ message: 'Invalid contact number format' });
    }
    try {
        const newSeller = new sellerModel_1.default({
            userId: userId,
            firstName,
            lastName,
            dob,
            gender,
            shopName,
            shopDescription,
            address,
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
//  function to validate date format
const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regex))
        return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
};
