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
exports.updateSellerProfile = void 0;
const sellerModel_1 = __importDefault(require("../../../models/sellerModel"));
const updateSellerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { shopName, shopDescription, shopContactNumber, businessLicense, taxId, website, } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return res.status(400).json({ message: 'User ID not found' });
    }
    const updateFields = {};
    if (shopName !== undefined) {
        if (typeof shopName !== 'string' || shopName.length < 3) {
            return res.status(400).json({
                message: 'Shop name must be a string and at least 3 characters long',
            });
        }
        updateFields.shopName = shopName;
    }
    if (shopDescription !== undefined) {
        if (typeof shopDescription !== 'string' || shopDescription.length < 10) {
            return res.status(400).json({
                message: 'Shop description must be a string and at least 10 characters long',
            });
        }
        updateFields.shopDescription = shopDescription;
    }
    if (shopContactNumber !== undefined) {
        if (typeof shopContactNumber !== 'number') {
            return res
                .status(400)
                .json({ message: 'Shop contact number must be a number' });
        }
        if (!/^\d{10,15}$/.test(shopContactNumber.toString())) {
            return res
                .status(400)
                .json({ message: 'Contact number must be between 10 and 15 digits' });
        }
        updateFields.shopContactNumber = shopContactNumber;
    }
    if (businessLicense !== undefined) {
        if (typeof businessLicense !== 'string') {
            return res
                .status(400)
                .json({ message: 'Business license must be a string' });
        }
        updateFields.businessLicense = businessLicense;
    }
    if (taxId !== undefined) {
        if (typeof taxId !== 'string') {
            return res.status(400).json({ message: 'Tax ID must be a string' });
        }
        updateFields.taxId = taxId;
    }
    if (website !== undefined) {
        if (typeof website !== 'string') {
            return res.status(400).json({ message: 'Website must be a string' });
        }
        if (!/^https?:\/\/[\w\-]+\.[\w\-]+/.test(website)) {
            return res.status(400).json({ message: 'Invalid website URL' });
        }
        updateFields.website = website;
    }
    try {
        const updatedSeller = yield sellerModel_1.default.findOneAndUpdate({ userId }, { $set: updateFields }, { new: true, runValidators: true });
        if (!updatedSeller) {
            return res.status(404).json({ message: 'Seller profile not found' });
        }
        res.status(200).json({
            message: 'Seller profile updated successfully',
            seller: updatedSeller,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update seller profile', error });
    }
});
exports.updateSellerProfile = updateSellerProfile;
