const express = require("express");
const { sendCompanyProfile, getCompanyProfile } = require("../../controllers/settings/CompanySettingController.js");
const upload = require("../../config/upload.js")
const { authMiddleware } = require("../../middleware/auth");

const companysettingrouter = express.Router();

// ✅ Protected routes - require authentication to match master/tenant DB context
companysettingrouter.post("/send", authMiddleware, upload.fields([
    { name: "companyIcon", maxCount: 1 },
    { name: "companyFavicon", maxCount: 1 },
    { name: "companyLogo", maxCount: 1 },
    { name: "companyDarkLogo", maxCount: 1 },
    
]), sendCompanyProfile);

// ✅ Protected route - fetch company profile with auth context
companysettingrouter.get("/get", authMiddleware, getCompanyProfile)

module.exports = companysettingrouter;
