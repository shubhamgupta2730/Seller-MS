"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sellerProfileController_1 = require("../controllers/sellerProfileController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Route to create a seller profile
router.post('/sellerProfile', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, sellerProfileController_1.createSellerProfile);
exports.default = router;
