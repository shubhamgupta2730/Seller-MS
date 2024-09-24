"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sellerProfileController_1 = require("../controllers/sellerProfileController");
const viewSellerProfile_1 = require("../controllers/viewSellerProfile");
const updateSellerProfile_1 = require("../controllers/updateSellerProfile");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Route to create a seller profile
router.post('/sellerProfile', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, sellerProfileController_1.createSellerProfile);
router.get('/getSellerProfile', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, viewSellerProfile_1.viewSellerProfile);
router.patch('/update-profile', authMiddleware_1.authenticateSeller, authMiddleware_1.authorizeSeller, updateSellerProfile_1.updateSellerProfile);
exports.default = router;
