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
router.post('/discount', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.addDiscount);
router.put('/discount', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.updateDiscount);
router.delete('/discount', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, index_1.removeDiscount);
exports.default = router;
