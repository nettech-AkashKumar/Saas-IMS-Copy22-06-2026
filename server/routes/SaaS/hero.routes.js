const router = require("express").Router();
const multer = require("multer");
const {
  getHeroContent,
  getPublicwebsite,
  getAllHeroContents,
  getHeroByTemplateType,
  createHeroContent,
  updateHeroContent,
  uploadHeroImage,
  deleteHeroContent,
  verifyWebsitePassword,
} = require("../../controllers/SaaS/superAdmin/hero.controller");
const { verifyAdminToken } = require("../../middleware/SaaS/superAdminAuth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Public routes
router.get("/", getHeroContent); // Get hero content (default behavior)
router.get("/public-website", getPublicwebsite); // Get only active hero for public website
router.post("/verify-password", verifyWebsitePassword); // Verify super admin password for website access
router.get("/all", verifyAdminToken, getAllHeroContents); // Get all hero sections for admin
router.get("/template/:templateType", verifyAdminToken, getHeroByTemplateType); // Get hero by template type

// Protected routes
router.post("/", verifyAdminToken, createHeroContent); // Create new hero section
router.patch("/:id", verifyAdminToken, updateHeroContent); // Update hero section by ID
router.delete("/:id", verifyAdminToken, deleteHeroContent); // Delete hero section by ID
router.post("/:id/upload", verifyAdminToken, upload.single("heroImage"), uploadHeroImage); // Upload image for specific hero

module.exports = router;
