// routes/unitRoutes.js
const express = require("express");
const router = express.Router();
const unitController = require("../controllers/unitsController");
const { authMiddleware } = require("../middleware/auth.js");
const { checkPermission } = require("../middleware/permission/checkPermission.js");

router.post("/units", authMiddleware, checkPermission("Units", "write"), unitController.createUnit);
router.get("/units", authMiddleware, checkPermission("Units", "read"), unitController.getUnits);
router.get("/units/:id", authMiddleware, unitController.getUnitById);
router.put("/units/:id", authMiddleware, checkPermission("Units", "update"), unitController.updateUnit);
router.delete("/units/:id", authMiddleware, checkPermission("Units", "delete"), unitController.deleteUnit);
router.get("/deleted", authMiddleware, unitController.getDeletedUnits);
router.patch("/restore/:id", authMiddleware, checkPermission("Units", "update"), unitController.restoreUnit);
router.get("/units/status/active", authMiddleware, unitController.getActiveUnits);

module.exports = router;