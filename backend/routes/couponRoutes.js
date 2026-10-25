const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const tenantMiddleware = require("../middlewares/tenantMiddleware");
const couponController = require("../controllers/couponController");

// Public Client Route (Used by Payment Page for validation)
router.post("/validate", tenantMiddleware, couponController.validateCoupon);

// Admin Protected CRUD Routes
const adminAuth = [tenantMiddleware, authMiddleware, roleMiddleware("admin")];

router.get("/", adminAuth, couponController.getAllCoupons);
router.post("/", adminAuth, couponController.createCoupon);
router.put("/:id", adminAuth, couponController.updateCoupon);
router.patch("/:id/toggle", adminAuth, couponController.toggleCouponStatus);
router.delete("/:id", adminAuth, couponController.deleteCoupon);

module.exports = router;