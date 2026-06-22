// routes/unitRoutes.js
const express = require("express");
const router = express.Router();
const taxController = require("../controllers/taxController");
const { authMiddleware } = require("../middleware/auth.js");
const { checkPermission } = require("../middleware/permission/checkPermission.js");

router.post("/add-tax", authMiddleware, checkPermission("tax", "write"), taxController.createtax);
router.get("/tax", authMiddleware, checkPermission("tax", "read"), taxController.gettax);
router.get("/tax/:id", authMiddleware, taxController.gettaxById);
router.put("/tax/:id", authMiddleware, checkPermission("tax", "update"), taxController.updatetax);
router.delete("/tax/:id", authMiddleware, checkPermission("tax", "delete"), taxController.deletetax);
router.get("/deleted", authMiddleware, taxController.getDeletedTax);
router.patch("/restore/:id", authMiddleware, checkPermission("tax", "update"), taxController.restoreTax);
router.get("/active-tax", authMiddleware, taxController.getActivetax);

module.exports = router;