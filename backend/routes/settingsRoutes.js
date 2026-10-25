const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const tenantMiddleware = require("../middlewares/tenantMiddleware");
const upload = require("../middlewares/upload");
const settingsController = require("../controllers/settingsController");

// Public Get Settings
router.get("/", tenantMiddleware, settingsController.getSettings);

// Admin Protected Update
router.put(
  "/",
  tenantMiddleware,
  authMiddleware,
  roleMiddleware("admin"),
  upload.fields([{ name: "navbarLogo", maxCount: 1 }]),
  settingsController.updateSettings
);

// Admin Protected Test SMTP Connection
router.post(
  "/test-mail",
  tenantMiddleware,
  authMiddleware,
  roleMiddleware("admin"),
  settingsController.testMailConfig
);

module.exports = router;