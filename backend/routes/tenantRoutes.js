const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// 1. Current Resolved Store Info (Public - Frontend setup ke liye zaroori)
router.get("/current", tenantController.getCurrentTenant);

// 2. Tenant Store Onboarding (Naya Store Register karne ke liye)
router.post("/onboard", tenantController.createTenant);

// 3. Custom Domain Mapping & Updating (Admin Only)
router.put(
  "/domain",
  authMiddleware,
  roleMiddleware("admin"),
  tenantController.updateCustomDomain
);

module.exports = router;