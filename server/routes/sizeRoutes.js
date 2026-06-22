// routes/unitRoutes.js
const express = require("express");
const router = express.Router();
const sizeController = require("../controllers/sizeController");
const { authMiddleware } = require("../middleware/auth.js");
const { checkPermission } = require("../middleware/permission/checkPermission.js");

router.post("/add-size", authMiddleware, checkPermission("Size", "write"), sizeController.createSize);
router.get("/size", authMiddleware, checkPermission("Size", "read"), sizeController.getSize);
router.get("/size/:id", authMiddleware, sizeController.getSizeById);
router.put("/size/:id", authMiddleware, checkPermission("Size", "update"), sizeController.updateSize);
router.delete("/size/:id", authMiddleware, checkPermission("Size", "delete"), sizeController.deleteSize);
router.get("/deleted", authMiddleware, sizeController.getDeletedSizes);
router.patch("/restore/:id", authMiddleware, sizeController.restoreSize);
router.get("/active-sizes", authMiddleware, sizeController.getActiveSize);

module.exports = router;