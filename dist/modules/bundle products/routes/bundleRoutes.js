"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/discountRoutes.ts
const express_1 = __importDefault(require("express"));
const index_1 = require("../controllers/index");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const router = express_1.default.Router();
router.post('/bundle', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.createBundle);
router.get('/bundle', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.getAllBundleProductSales);
router.get('/bundle-details', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.getBundleDetails);
router.patch('/bundle', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.updateBundle);
router.patch('/remove-product', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.removeProductFromBundle);
router.delete('/bundle', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.deleteBundle);
exports.default = router;
