const express = require("express");
const router = express.Router();

// Middlewares
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const tenantMiddleware = require("../middlewares/tenantMiddleware");

// Controller
const couponController = require("../controllers/couponController");

// =========================================================================
// 1. PUBLIC CHECKOUT ENDPOINTS (Payment & Products Page Validation)
// =========================================================================
// Dono paths support kiye gaye hain taaki frontend se URL mismatch ka 404 na aaye
router.post("/validate", tenantMiddleware, couponController.validateCoupon);
router.post("/verify", tenantMiddleware, couponController.validateCoupon);

// =========================================================================
// 2. ADMIN STUDIO PROTECTED ENDPOINTS (CRUD & Live Toggle)
// =========================================================================
const adminAuth = [tenantMiddleware, authMiddleware, roleMiddleware("admin")];

// A. Get all coupons for this store
router.get("/", adminAuth, couponController.getAllCoupons);

// B. Create a new coupon
router.post("/", adminAuth, couponController.createCoupon);

// C. Update coupon details
router.put("/:id", adminAuth, couponController.updateCoupon);

// D. Toggle Live (Active) / Inactive status
router.patch("/:id/toggle", adminAuth, couponController.toggleCouponStatus);

// E. Delete coupon
router.delete("/:id", adminAuth, couponController.deleteCoupon);

module.exports = router;