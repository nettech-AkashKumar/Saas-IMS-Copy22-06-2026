const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/customerquotationController");
const { authMiddleware } = require("../middleware/auth");
const multer = require("multer");

// Create multer upload middleware
const uploadMiddleware = multer({
  storage: multer.diskStorage({
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
}).array("attachments", 5); // Max 5 files per upload

// Routes
router.post(
  "/",
  authMiddleware,
  uploadMiddleware,
  quotationController.createQuotation
);

router.get("/", authMiddleware, quotationController.getAllQuotations);
router.get("/stats", authMiddleware, quotationController.getQuotationStats);
router.get("/:id", authMiddleware, quotationController.getQuotationById);
router.put(
  "/:id",
  authMiddleware,
  uploadMiddleware,
  quotationController.updateQuotation
);
router.delete("/:id", authMiddleware, quotationController.deleteQuotation);
router.post("/:id/convert", authMiddleware, quotationController.convertToInvoice);
router.put("/:id/status", authMiddleware, quotationController.updateStatus);
router.post("/:id/convert-to-proforma", authMiddleware, quotationController.convertToProforma);

module.exports = router;