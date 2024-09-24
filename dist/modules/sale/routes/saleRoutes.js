"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const addProductToSale_1 = require("../controllers/addProductToSale");
const removeProductFromSale_1 = require("../controllers/removeProductFromSale");
const getSale_1 = require("../controllers/getSale");
const router = express_1.default.Router();
router.post('/add-products', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, addProductToSale_1.sellerAddProductsToSale);
router.post('/remove-products', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, removeProductFromSale_1.removeSellerProductFromSale);
router.get('/get-sale', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, getSale_1.getSellerSale);
exports.default = router;
