// routes/shipmentRoutes.js
const express = require("express");
const router = express.Router();
const shipmentController = require("../controllers/shipmentController");
const { authMiddleware } = require("../middleware/auth");
const multer = require("multer");

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

// All routes require authentication
router.use(authMiddleware);

// router.post("/", shipmentController.createShipment);

// Way 2: Create shipment from existing invoice
router.post("/from-invoice/:invoiceId", upload, shipmentController.createShipmentFromInvoice);

// CRUD operations
router.get("/", shipmentController.getAllShipments);
router.get("/stats", shipmentController.getShipmentStats);
router.get("/:id", shipmentController.getShipmentById);
router.put("/:id", upload, shipmentController.updateShipment);
router.delete("/:id", shipmentController.deleteShipment);
router.delete("/:id/attachments/:attachmentId", shipmentController.deleteAttachment);

// Status and tracking
router.put("/:id/status", shipmentController.updateShipmentStatus);
router.post("/:id/tracking", shipmentController.addTrackingUpdate);
// router.put('/shipments/:id/status', shipmentController.updateShipmentStatus);
router.put('/shipments/by-invoice/:invoiceId/status', shipmentController.updateShipmentStatusByInvoice);
module.exports = router;