const express = require("express");
const router = express.Router();

const {
  loginUser,
  logoutUser,
  logDevice,
  getMe,
  verifyotp,
  allLogin,
  loginTenant,
  verifyAdminPassword,
} = require("../controllers/authController");

const { authMiddleware } = require("../middleware/auth");

// SaaS auth controllers (now in authController)
// const { allLogin, loginTenant } = require("../controllers/authController");

// Main login (for non-SaaS users, if needed)
router.post("/login", loginUser);

// SaaS tenant login
router.post("/tenant-login", loginTenant);

// Unified login (handles super admin and tenant)
router.post("/all-login", allLogin);

// Verify login OTP
router.post("/verify_otp", verifyotp);

// Logout
router.post("/logout", logoutUser);

// Log device (protected)
router.post("/log-device", authMiddleware, logDevice);

// Verify current admin password for sensitive role actions
router.post("/verify-admin-password", authMiddleware, verifyAdminPassword);

// Get logged-in user
router.get("/me", authMiddleware, getMe);

module.exports = router;
