const express = require("express");
const router = express.Router();
const multer = require("multer");
const grnController = require("../controllers/GRNController");
const { authMiddleware } = require("../middleware/auth");

// Configure multer for file uploads
const uploadMiddleware = multer({
  storage: multer.diskStorage({
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
}).array("attachments", 10);

// Routes
router.post(
  "/",
  authMiddleware,
  uploadMiddleware,
  grnController.createGRN
);

router.get(
  "/",
  authMiddleware,
  grnController.getAllGRNs
);

router.get(
  "/:id",
  authMiddleware,
  grnController.getGRNById
);

router.delete(
  "/:id",
  authMiddleware,
  grnController.deleteGRN
);

module.exports = router;