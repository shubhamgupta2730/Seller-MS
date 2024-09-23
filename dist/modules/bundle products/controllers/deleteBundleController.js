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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBundle = void 0;
const index_1 = require("../../../models/index");
const deleteBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { bundleId } = req.query;
    const sellerAuthId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!sellerAuthId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!bundleId || typeof bundleId !== 'string') {
        return res.status(400).json({ message: 'Invalid bundle ID' });
    }
    try {
        const bundle = yield index_1.BundleProduct.findById(bundleId);
        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        if (bundle.sellerAuthId.toString() !== sellerAuthId) {
            return res
                .status(403)
                .json({ message: 'Unauthorized to delete this bundle' });
        }
        // Remove the bundle ID from products associated with the bundle
        yield index_1.Product.updateMany({ bundleId: bundle._id }, { $unset: { bundleId: '' } });
        // Find and delete associated discounts
        const result = yield index_1.Discount.deleteMany({ bundleId: bundle._id });
        if (result.deletedCount === 0) {
            console.warn('No associated discounts found for this bundle');
        }
        // Delete the bundle
        yield index_1.BundleProduct.deleteOne({ _id: bundleId });
        res.status(200).json({
            message: 'Bundle and associated discounts deleted successfully',
        });
    }
    catch (error) {
        console.error('Failed to delete bundle', error);
        res.status(500).json({ message: 'Failed to delete bundle', error });
    }
});
exports.deleteBundle = deleteBundle;
