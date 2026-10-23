const express = require("express");
const router = express.Router();
const cmsController = require("../controllers/productPageCmsController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const adminAuth = [authMiddleware, roleMiddleware("admin")];

// Public
router.get("/config", cmsController.getPageConfig);

// Admin Protected
router.put("/config", adminAuth, cmsController.updatePageConfig);

module.exports = router;