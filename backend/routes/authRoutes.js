const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// Public Auth Endpoints
router.post("/register", authController.register);
router.post("/verify-registration-otp", authController.verifyRegistrationOtp);
router.post("/login", authController.login);
router.post("/verify-login-otp", authController.verifyLoginOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/google", authController.googleLogin);
router.post("/logout", authController.logout);

// Profile Endpoints (GET and PUT)
router.get("/profile", authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);

module.exports = router;