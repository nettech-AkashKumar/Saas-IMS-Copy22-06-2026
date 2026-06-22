const express = require("express");
const router = express.Router();
const {
  getTaxGstSettings,
  updateTaxGstSettings,
  resetTaxGstSettings,
} = require("../../controllers/settings/taxGstController");
const { authMiddleware } = require("../../middleware/auth");

// Authentication middleware applied to all routes to set req.db context
router.use(authMiddleware);

router.get("/", getTaxGstSettings);
router.put("/", updateTaxGstSettings);
router.post("/reset", resetTaxGstSettings);

module.exports = router;