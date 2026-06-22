const express = require("express");
const userrouter = express.Router();
const {
  createUser,
  getUser,
  getSingleUser,
  updateUser,
  updateUserProfile,
  deleteUser,
  toggleAccountStatus,
  toggleTwoFactor,
} = require("../../controllers/settings/userController.js");
const { authMiddleware } = require("../../middleware/auth");

userrouter.post("/register", createUser);
userrouter.get("/get", authMiddleware, getUser);
userrouter.get("/single", authMiddleware, getSingleUser);
userrouter.put("/update/:id", authMiddleware, updateUser);
userrouter.put("/profile/:id", authMiddleware, updateUserProfile);
userrouter.put("/toggle-status/:id", authMiddleware, toggleAccountStatus);
userrouter.put("/toggle-2fa/:id", authMiddleware, toggleTwoFactor);
userrouter.delete("/delete/:id", authMiddleware, deleteUser);

module.exports = userrouter;
