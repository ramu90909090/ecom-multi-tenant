const express = require("express");
const router = express.Router();
const controller = require("../controllers/whatsappAdminController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Sirf store Admin hi WhatsApp Automation manage kar sakta hai[cite: 3]
router.use(authMiddleware, roleMiddleware("admin"));

// WhatsApp Client Session Management
router.get("/status", controller.getSessionStatus);
router.post("/reconnect", controller.reconnectSession);
router.post("/new-session", controller.startNewSession);
router.post("/logout", controller.logoutSession);

// WhatsApp Message Logs CRM
router.get("/logs", controller.getWhatsappLogs);
router.post("/retry/:id", controller.retryMessage);
router.post("/bulk-delete", controller.bulkDeleteLogs);

module.exports = router;