const express = require("express");
const router = express.Router();
const { createEmployee } = require("../../controllers/SaaS/tenant/employee.controller");
const { authMiddleware } = require("../../middleware/auth");

router.post("/employee", authMiddleware, createEmployee);

module.exports = router;
