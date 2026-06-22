const express = require("express");
const router = express.Router();
const {
  getPrintTemplate,
  updatePrintTemplate,
  getAllTemplates,
  generatePreview,
  uploadSignature,
  deleteSignature,
} = require("../../controllers/settings/printTemplateController");
const { authMiddleware } = require("../../middleware/auth");
const upload = require("../../config/upload.js");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get print template with optional data
router.get("/", getPrintTemplate);

// Get all templates
router.get("/all", getAllTemplates);

// Update template (with optional ID)
router.put("/:id", updatePrintTemplate);
router.put("/", updatePrintTemplate);

// Upload signature
router.post("/upload-signature", upload.single("signature"), uploadSignature);

// Delete signature
router.delete("/delete-signature", deleteSignature);

// Generate preview with dynamic data
router.post("/preview", generatePreview);

module.exports = router;
