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
exports.viewSellerProfile = void 0;
const sellerModel_1 = __importDefault(require("../../../models/sellerModel"));
const viewSellerProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    try {
        const sellerProfile = yield sellerModel_1.default.findOne({
            userId: sellerId,
        });
        if (!sellerProfile) {
            return res.status(404).json({ message: 'Seller profile not found' });
        }
        const seller = {
            _id: sellerProfile._id,
            shopName: sellerProfile.shopName,
            shopDescription: sellerProfile.shopDescription,
            shopContactNumber: sellerProfile.shopContactNumber,
            businessLicense: sellerProfile.businessLicense,
            taxId: sellerProfile.taxId,
            website: sellerProfile.website,
        };
        return res.status(200).json({
            message: 'Seller profile',
            seller,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: 'Failed to retrieve seller profile',
            error,
        });
    }
});
exports.viewSellerProfile = viewSellerProfile;
