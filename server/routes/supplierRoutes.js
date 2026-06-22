const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

const upload = require("../middleware/Multer/multer");
const { authMiddleware } = require("../middleware/auth.js")

router.post('/', authMiddleware, supplierController.createSupplier);
router.get('/', authMiddleware, supplierController.getAllSuppliers);
router.get('/active-suppliers', authMiddleware, supplierController.getActiveSuppliers);
router.get("/deleted", authMiddleware, supplierController.getDeletedSuppliers);
router.patch("/restore/:id", authMiddleware, supplierController.restoreSupplier);
// router.get("/suppliers/active-dropdown", supplierController.getActiveSuppliersDropdown);
router.get('/:id', authMiddleware, supplierController.getSupplierById);
router.put('/:id', upload.array('images'), authMiddleware, supplierController.updateSupplier);
router.delete('/:id', authMiddleware, supplierController.deleteSupplier);
router.get("/:id/statistics", authMiddleware, supplierController.getSupplierStatistics);
router.post("/:id/recalculate-due", authMiddleware, supplierController.recalculateSupplierDue);

module.exports = router;