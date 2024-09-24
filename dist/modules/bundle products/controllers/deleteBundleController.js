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
exports.deleteBundle = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../../../models/index");
const deleteBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { bundleId } = req.query;
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!sellerId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (typeof bundleId !== 'string' ||
        !mongoose_1.default.Types.ObjectId.isValid(bundleId)) {
        return res.status(400).json({ message: 'Invalid bundle ID format' });
    }
    try {
        // Find the bundle
        const bundle = yield index_1.Bundle.findOne({
            _id: bundleId,
            isActive: true,
            isBlocked: false,
            isDeleted: false,
        });
        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        // Check if the current user is authorized to delete the bundle
        if (((_b = bundle.sellerId) === null || _b === void 0 ? void 0 : _b.toString()) !== sellerId) {
            return res
                .status(403)
                .json({ message: 'Unauthorized to delete this bundle' });
        }
        // Remove the bundle ID from products associated with the bundle
        yield index_1.Product.updateMany({ bundleIds: new mongoose_1.default.Types.ObjectId(bundleId) }, { $unset: { bundleId: '' } });
        // Soft delete the bundle
        bundle.isDeleted = true;
        yield bundle.save();
        res.status(200).json({
            message: 'Bundle deleted successfully.',
        });
    }
    catch (error) {
        console.error('Failed to delete bundle', error);
        res.status(500).json({ message: 'Failed to delete bundle', error });
    }
});
exports.deleteBundle = deleteBundle;
