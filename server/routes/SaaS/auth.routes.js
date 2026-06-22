const express = require("express");
const router = express.Router();
const { loginTenant, allLogin } = require("../../controllers/authController");

// Tenant login
router.post("/login", loginTenant);
router.post("/all-login", allLogin);

module.exports = router;
