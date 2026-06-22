const express = require("express");
const { getVariant, createVariant, updateVariant, deleteVariant, getActiveVariants, getValuesByVariant } = require("../controllers/varientController");
const { authMiddleware } = require("../middleware/auth.js");
const { checkPermission } = require("../middleware/permission/checkPermission");
const router = express.Router();

// CRUD
router.get("/", authMiddleware, checkPermission("Variant", "read"), getVariant);
router.post("/", authMiddleware, checkPermission("Variant", "write"), createVariant);
router.put("/:id", authMiddleware, checkPermission("Variant", "update"), updateVariant);
router.delete("/:id", authMiddleware, checkPermission("Variant", "delete"), deleteVariant);

// Dropdown endpoints
router.get("/active-variants", authMiddleware, getActiveVariants);
router.get("/values/:variant", authMiddleware, getValuesByVariant);

module.exports = router;