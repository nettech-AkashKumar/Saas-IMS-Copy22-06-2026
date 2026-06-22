const router = require("express").Router();
const {
  getPublicPricing,
  getAllPricing,
  createPricing,
  updatePricing,
  deletePricing,
} = require("../../controllers/SaaS/superAdmin/pricing.controller");
const { verifyAdminToken } = require("../../middleware/SaaS/superAdminAuth");

// Public routes
router.get("/", getPublicPricing); // Get active pricing for website
router.get("/all", verifyAdminToken, getAllPricing); // Get all pricing plans for admin

// Protected routes
router.post("/", verifyAdminToken, createPricing); // Create pricing plan
router.patch("/:id", verifyAdminToken, updatePricing); // Update pricing plan
router.delete("/:id", verifyAdminToken, deletePricing); // Delete pricing plan

module.exports = router;
