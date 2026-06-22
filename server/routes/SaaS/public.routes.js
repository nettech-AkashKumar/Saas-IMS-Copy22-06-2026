// src/routes/public.routes.js
const express = require("express");
const router = express.Router();
const { registerCompany, sendOtpToEmail, verifyOtpForEmail, getCompanyDetails, getCompanyModulePermissions } = require("../../controllers/SaaS/public/registerCompany.controller");
const { getPublicFAQs } = require("../../controllers/SaaS/superAdmin/faq.controller");
const contactRoutes = require("./contact.routes");

router.post("/register-company", registerCompany);
router.get("/company-details", getCompanyDetails);
router.get("/company-modules", getCompanyModulePermissions);
router.get("/faqs", getPublicFAQs);

router.use("/contact", contactRoutes);

// router.post("/send-otp", sendOtpToEmail);
// router.post("/verify-otp", verifyOtpForEmail);

module.exports = router;
