"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sellerProfileRoute_1 = __importDefault(require("../modules/sellerProfile/routes/sellerProfileRoute"));
const productRoutes_1 = __importDefault(require("../modules/product/routes/productRoutes"));
const discountRoutes_1 = __importDefault(require("../modules/discount/routes/discountRoutes"));
const bundleRoutes_1 = __importDefault(require("../modules/bundle products/routes/bundleRoutes"));
const router = express_1.default.Router();
router.use('/sellerProfileRoute', sellerProfileRoute_1.default);
router.use('/productRoute', productRoutes_1.default);
router.use('/discountRoute', discountRoutes_1.default);
router.use('/bundleRoute', bundleRoutes_1.default);
exports.default = router;
