const express = require("express");
const upload = require("../../config/upload"); // This now uses Cloudinary
const {
  addCompanyBank,
  getCompanyBanks,
  getDefaultBank,
  updateCompanyBank
} = require("../../controllers/settings/companyBankController");
const { authMiddleware } = require("../../middleware/auth");

const router = express.Router();

// ✅ All routes protected with authMiddleware to set req.db (tenant/master context)
router.post("/add", authMiddleware, upload.single("qrCode"), addCompanyBank);
router.get("/list", authMiddleware, getCompanyBanks);
router.get("/default", authMiddleware, getDefaultBank);
router.put("/update/:id", authMiddleware, upload.single("qrCode"), updateCompanyBank);

module.exports = router;