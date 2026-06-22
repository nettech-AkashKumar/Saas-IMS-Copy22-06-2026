const express = require("express");
const router = express.Router();
const {
  superAdminLogin,
  superAdminLogout,
} = require("../controllers/superAdminLoginController");
const { authMiddleware } = require("../middleware/auth");

// ============================
// ✅ PUBLIC ROUTES
// ============================
router.post("/login", superAdminLogin);

// ============================
// ✅ PROTECTED ROUTES
// ============================
router.post("/logout", authMiddleware, superAdminLogout);

module.exports = router;
