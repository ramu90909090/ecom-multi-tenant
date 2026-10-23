const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { getSettings, updateSettings } = require("../controllers/settingsController");

const adminAuth = [authMiddleware, roleMiddleware("admin")];

// 1. Public Settings Endpoint (Dynamic Navbar, Footer & Branding)
router.get("/", getSettings);

// 2. Admin Settings Update (Logos, Payment QR Image, Favicon, Title)
router.put(
  "/",
  adminAuth,
  upload.fields([
    { name: "navbarLogo", maxCount: 1 },
    { name: "footerLogo", maxCount: 1 },
    { name: "paymentQrFile", maxCount: 1 },
    { name: "faviconFile", maxCount: 1 }
  ]),
  updateSettings
);

module.exports = router;