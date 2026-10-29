const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const tenantMiddleware = require("../middlewares/tenantMiddleware");

// Public Endpoint (Payment page calculation)
router.post("/calculate", tenantMiddleware, deliveryController.calculateCartDelivery);

// Admin Studio Protected Endpoints
const adminAuth = [tenantMiddleware, authMiddleware, roleMiddleware("admin")];
router.get("/", adminAuth, deliveryController.getAllDeliveryRules);
router.post("/", adminAuth, deliveryController.createDeliveryRule);
router.put("/:id", adminAuth, deliveryController.updateDeliveryRule);
router.patch("/:id/toggle", adminAuth, deliveryController.toggleDeliveryStatus);
router.delete("/:id", adminAuth, deliveryController.deleteDeliveryRule);

module.exports = router;