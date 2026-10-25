const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const tenantMiddleware = require("../middlewares/tenantMiddleware");
const upload = require("../middlewares/upload");
const settingsController = require("../controllers/settingsController");

// Public Get Settings
router.get("/", tenantMiddleware, settingsController.getSettings);

// Admin Protected Update - Sirf navbarLogo file upload allowed hai
router.put(
  "/",
  tenantMiddleware,
  authMiddleware,
  roleMiddleware("admin"),
  upload.fields([
    { name: "navbarLogo", maxCount: 1 }
  ]),
  settingsController.updateSettings
);

module.exports = router;