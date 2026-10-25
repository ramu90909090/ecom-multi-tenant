const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const tenantMiddleware = require("../middlewares/tenantMiddleware");
const userController = require("../controllers/userController");

// Admin Guards
const adminAuth = [tenantMiddleware, authMiddleware, roleMiddleware("admin")];

// 1. Get all users with filters & pagination
router.get("/", adminAuth, userController.getAllUsers);

// 2. Create new user by admin
router.post("/", adminAuth, userController.createUser);

// 3. Update user role/credentials (Triggers auto alerts)
router.put("/:id", adminAuth, userController.updateUser);

// 4. Delete user (Protected)
router.delete("/:id", adminAuth, userController.deleteUser);

// 5. Direct Custom Broadcast (Dual WhatsApp & Email)
router.post("/send-custom-notification", adminAuth, userController.sendCustomNotification);

module.exports = router;