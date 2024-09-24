"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardSales_1 = require("../controllers/dashboardSales");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Route to create a seller profile
router.get('/get-total-sales', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, dashboardSales_1.getSellerSalesAnalytics);
exports.default = router;
