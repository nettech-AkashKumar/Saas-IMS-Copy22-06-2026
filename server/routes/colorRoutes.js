// routes/unitRoutes.js
const express = require("express");
const router = express.Router();
const colorController = require("../controllers/colorController");
const { authMiddleware } = require("../middleware/auth.js")
const { verifyToken } = require("../middleware/Authentication/verifyToken.js")
const { checkPermission } = require("../middleware/permission/checkPermission.js")

router.post("/add-color", verifyToken, checkPermission("Color", "write"), authMiddleware, colorController.createColor);
router.get("/color", verifyToken, checkPermission("Color", "read"), authMiddleware, colorController.getColor);
router.get("/color/:id", authMiddleware, colorController.getColorById);
router.put("/color/:id", verifyToken, checkPermission("Color", "update"), authMiddleware, colorController.updateColor);
router.delete("/color/:id", verifyToken, checkPermission("Color", "delete"), authMiddleware, colorController.deleteColor);
router.get("/deleted", verifyToken, authMiddleware, colorController.getDeletedColor);
router.patch("/restore/:id", verifyToken, authMiddleware, colorController.restoreColor);
router.get("/active-color", verifyToken, authMiddleware, colorController.getActiveColor);

module.exports = router;