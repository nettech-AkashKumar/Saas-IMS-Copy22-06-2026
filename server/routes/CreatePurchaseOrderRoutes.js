const express = require("express");
const router = express.Router();
const multer = require("multer");
const purchaseOrderController = require("../controllers/CreatePurchaseOrderController");
const { authMiddleware } = require("../middleware/auth");

// Configure multer for file uploads
const uploadMiddleware = multer({
  storage: multer.diskStorage({
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).array("attachments", 10);

// Routes
router.post(
  "/",
  authMiddleware,
  uploadMiddleware,
  purchaseOrderController.createPurchaseOrder
);

router.get(
  "/",
  authMiddleware,
  purchaseOrderController.getAllPurchaseOrders
);

router.get(
  "/status-counts",
  authMiddleware,
  purchaseOrderController.getPurchaseOrderCounts
);

router.get(
  "/generate-number",
  authMiddleware,
  purchaseOrderController.generatePurchaseNumber
);

router.get(
  "/:id",
  authMiddleware,
  purchaseOrderController.getPurchaseOrderById
);

router.put(
  "/:id",
  authMiddleware,
  uploadMiddleware,
  purchaseOrderController.updatePurchaseOrder
);

router.put(
  "/:id/cancel",
  authMiddleware,
  purchaseOrderController.cancelPurchaseOrder
);

router.delete(
  "/:id",
  authMiddleware,
  purchaseOrderController.deletePurchaseOrder
);

module.exports = router;