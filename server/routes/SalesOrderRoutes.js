// routes/SalesOrderRoutes.js
const express = require("express");
const router = express.Router();
const salesOrderController = require("../controllers/SalesOrderController");
const { authMiddleware } = require("../middleware/auth");
const upload = require("../middleware/Multer/multer"); 

router.post("/", authMiddleware, upload.array("attachments"), salesOrderController.createSalesOrder);
router.get("/", authMiddleware, salesOrderController.getAllSalesOrders);
router.get("/:id", authMiddleware, salesOrderController.getSalesOrderById);
router.put("/:id", authMiddleware, salesOrderController.updateSalesOrder);
router.delete("/:id", authMiddleware, salesOrderController.deleteSalesOrder);
router.post("/:id/convert-to-invoice", authMiddleware, salesOrderController.convertToInvoice);
router.put("/:id/status", authMiddleware, salesOrderController.updateSalesOrderStatus);

module.exports = router;