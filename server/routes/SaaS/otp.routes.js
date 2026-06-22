const express = require("express");
const router = express.Router();
const { otpLimiter } = require("../../middleware/SaaS/rateLimiter");

const {
  sendOtpToEmail,
  verifyOtpForEmail
} = require("../../controllers/SaaS/public/otp.controller");

// SEND OTP — 5 requests per minute per IP
// router.post("/sendOtps", otpLimiter, sendOtpToEmail);
router.post("/sendOtps", sendOtpToEmail);

// VERIFY OTP — 5 attempts per minute per IP
// router.post("/verifyOtps", otpLimiter, verifyOtpForEmail);
router.post("/verifyOtps", verifyOtpForEmail);

module.exports = router;



