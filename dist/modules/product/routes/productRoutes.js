"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../controllers/index");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const router = express_1.default.Router();
router.post('/product', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.createProduct);
router.get('/product', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.getAllSellerProducts);
router.get('/specific-product', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.getProductDetails);
router.put('/product', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.updateProduct);
router.delete('/product', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.deleteProduct);
exports.default = router;
