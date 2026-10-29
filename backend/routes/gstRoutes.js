const express = require("express");
const router = express.Router();
const gstController = require("../controllers/gstController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const tenantMiddleware = require("../middlewares/tenantMiddleware");

// Public Endpoint (Payment page calculation)
router.post("/calculate", tenantMiddleware, gstController.calculateCartGst);
router.get("/active", tenantMiddleware, async (req, res) => {
  const GstConfig = require("../models/GstConfig");
  const query = { isActive: true };
  if (req.tenant?._id) query.tenant = req.tenant._id;
  const active = await GstConfig.find(query);
  res.json({ success: true, data: active });
});

// Admin Protected Endpoints
const adminAuth = [tenantMiddleware, authMiddleware, roleMiddleware("admin")];
router.get("/", adminAuth, gstController.getAllGstRules);
router.post("/", adminAuth, gstController.createGstRule);
router.put("/:id", adminAuth, gstController.updateGstRule);
router.patch("/:id/toggle", adminAuth, gstController.toggleGstStatus);
router.delete("/:id", adminAuth, gstController.deleteGstRule);

module.exports = router;