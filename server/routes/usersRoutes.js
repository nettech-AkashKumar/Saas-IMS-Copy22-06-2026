const express = require("express");
const router = express.Router();
const upload = require("../middleware/Multer/multer");
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getActiveUsers,
  userData,
  searchUsersByEmail,
  toggleTwoFactor,
  toggleAccountStatus,
  bulkDeleteUsers,
  updateLastLogin, // Added
} = require("../controllers/usersController");
const { authMiddleware } = require("../middleware/auth.js");

// Create user (with image upload)
router.post("/add", upload.single("profileImage"), authMiddleware, createUser);

// Get all users
router.get("/getuser", authMiddleware, getAllUsers);

// Search users by email
router.get("/search", authMiddleware, searchUsersByEmail);

// Get a specific user
router.get("/:id", authMiddleware, getUserById);

// Update user (with optional image upload)
router.put("/update/:id", upload.single("profileImage"), authMiddleware, updateUser);

// Delete user
router.delete("/userDelete/:id", authMiddleware, deleteUser);

// Get active users
router.get("/status/active", authMiddleware, getActiveUsers);

// User data
router.get("/userdata/:id", authMiddleware, userData);

// Two factor
router.put("/toggle-2fa/:id", authMiddleware, toggleTwoFactor);

// For activate and deactivate account
router.put("/toggle-status/:id", authMiddleware, toggleAccountStatus);

// For bulk delete
router.delete("/bulk-delete", authMiddleware, bulkDeleteUsers);

// Update last login (Added for new UI)
router.put("/update-last-login/:id", authMiddleware, updateLastLogin);

module.exports = router;