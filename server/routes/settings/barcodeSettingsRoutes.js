const express = require("express");
const router = express.Router();
const {
  getBarcodeSettings,
  updateBarcodeSettings,
  resetBarcodeSettings,
  getBarcodeSettingsWithCompany,
} = require("../../controllers/settings/barcodeSettingsController");
const { authMiddleware } = require("../../middleware/auth");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get barcode settings
router.get("/", getBarcodeSettings);

// Get barcode settings with company data
router.get("/with-company", getBarcodeSettingsWithCompany);

// Update barcode settings
router.put("/", updateBarcodeSettings);

// Reset barcode settings to defaults
router.post("/reset", resetBarcodeSettings);

module.exports = router;
