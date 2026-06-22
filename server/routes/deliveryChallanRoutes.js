// routes/deliveryChallanRoutes.js
const multer = require("multer");
const express = require("express");
const router = express.Router();
const deliveryChallanController = require("../controllers/deliveryChallanController");
const { authMiddleware } = require("../middleware/auth"); // Use authMiddleware like your other routes
const upload = multer({
  storage: multer.diskStorage({
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|xlsx|csv|doc|docx|txt/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images, PDF, Excel, CSV, DOC, DOCX, and TXT files are allowed"));
    }
  },
}).array("attachments", 5);

// Routes
router.post("/create-from-invoice", authMiddleware, upload, deliveryChallanController.createFromInvoice);
router.post("/create-from-salesOrder", authMiddleware, upload, deliveryChallanController.createFromSalesOrder);
// Add this new route
router.post("/create-independent", authMiddleware, upload, deliveryChallanController.createIndependent);
router.post("/:id/convert-to-invoice", authMiddleware, deliveryChallanController.convertToInvoice);
router.get("/", authMiddleware, deliveryChallanController.getAll);
// Add these additional routes for completeness
router.get("/:id", authMiddleware, deliveryChallanController.getDeliveryChallanById);
router.put("/:id/status", authMiddleware, deliveryChallanController.updateDeliveryChallanStatus);
router.put("/:id", authMiddleware, upload, deliveryChallanController.updateDeliveryChallan);
router.delete("/:id/attachments/:attachmentId", authMiddleware, deliveryChallanController.deleteAttachment);

module.exports = router;