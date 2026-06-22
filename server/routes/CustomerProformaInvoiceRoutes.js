// CustomerProformaInvoiceRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const proformaController = require("../controllers/CustomerProformaInvoiceController");
const multer = require("multer");

// Configure multer for file uploads (same as invoice)
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
}).array("attachments", 5);

// Routes with multer for file uploads
router.post("/", authMiddleware, uploadMiddleware, proformaController.createProformaInvoice);
router.put("/:id", authMiddleware, uploadMiddleware, proformaController.updateProformaInvoice);
router.get("/", authMiddleware, proformaController.getAllProformaInvoices);
router.get("/:id", authMiddleware, proformaController.getProformaById);
router.post("/:id/record-advance", authMiddleware, proformaController.recordAdvancePayment);
router.post("/:id/convert-to-sales-order", authMiddleware, proformaController.convertToSalesOrder);
router.post("/:id/convert-to-invoice", authMiddleware, proformaController.convertToSalesInvoice);
router.delete("/:id", authMiddleware, proformaController.deleteProformaInvoice);
router.post("/bulk-delete", authMiddleware, proformaController.bulkDeleteProformaInvoices);
router.put("/:id/status", authMiddleware, proformaController.updateProformaStatus);
module.exports = router;