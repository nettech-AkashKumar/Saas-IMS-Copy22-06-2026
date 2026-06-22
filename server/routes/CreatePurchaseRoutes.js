const express = require("express");
const router = express.Router();
const CreatePurchaseController = require("../controllers/CreatePurchaseController");
const { authMiddleware } = require("../middleware/auth");
const multer = require("multer");

// Create multer upload middleware
const uploadMiddleware = multer({
  storage: multer.diskStorage({
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png) and PDFs are allowed"));
    }
  },
}).array("attachments", 5);

// Routes
router.post(
  "/",
  authMiddleware,
  uploadMiddleware,
  CreatePurchaseController.createPurchase
);

router.get(
  "/",
  authMiddleware,
  CreatePurchaseController.getAllPurchases
);
router.get(
  "/stats",
  authMiddleware,
  CreatePurchaseController.getPurchaseStats
);
router.get(
  "/status-counts",
  authMiddleware,
  CreatePurchaseController.getPurchaseStatusCounts
);
router.post(
  "/:id/payment",
  authMiddleware,
  CreatePurchaseController.addPayment
);
router.get(
  "/:id",
  authMiddleware,
  CreatePurchaseController.getPurchaseById
);
router.put(
  "/:id",
  authMiddleware,
  uploadMiddleware,
  CreatePurchaseController.updatePurchase
);
router.delete(
  "/:id",
  authMiddleware,
  CreatePurchaseController.deletePurchase
);
router.delete("/:id/attachments/:attachmentId", authMiddleware, CreatePurchaseController.deleteAttachment);

// Supplier-based queries
router.get(
  "/supplier/:supplierId",
  authMiddleware,
  CreatePurchaseController.getPurchasesBySupplier
);
router.get(
  "/supplier/:supplierId/unpaid",
  authMiddleware,
  CreatePurchaseController.getUnpaidPurchasesBySupplier
);
router.get(
  "/supplier/:supplierId/overdue",
  authMiddleware,
  CreatePurchaseController.getOverduePurchasesBySupplier
);
router.put("/:id/debit-note", authMiddleware, CreatePurchaseController.updateDebitNoteReference);

module.exports = router;
