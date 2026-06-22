// const express = require("express");
// const router = express.Router();

// const {
//   forgotPassword,
//   verifyOtpCheck,
//   verifyOtpAndReset,
//   checkResetSession,
//   verifyotp,
//   resendOtp,
// } = require("../controllers/forgotController");

// // Forgot password → send OTP
// router.post("/forgot-password", forgotPassword);

// // After forgot → verify OTP only
// router.post("/verify-otp-reset-check", verifyOtpCheck);

// // Verify OTP & reset password
// router.post("/verify-otp-reset", verifyOtpAndReset);

// // Check reset token session
// router.get("/check-reset-session", checkResetSession);

// // 2FA OTP verify (login flow)
// router.post("/verify-otp", verifyotp);

// // Resend OTP
// router.post("/resend-otp", resendOtp);

// module.exports = router;


// =====================
//  💀 New Code       //--------------------------------------------------------------------------------------------
// =====================

const express = require("express");

const {
  emailVerify,
  sendOtp,
  verifyOtp,
  forgetUserPass,
  checkResetSession,
} = require("../controllers/forgotController");

const {
  otpSendLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
} = require("../middleware/rateLimiter");

const forgotPassRoute = express.Router();
// const strictAccess = require("../middleware/strictAccess");

// ✅ FIXED: Correct import (NO destructuring)
// const verifyToken = require("../middleware/VeryfyToken");
/* ================= ROUTES ================= */

// 1️⃣ Verify email exists
forgotPassRoute.post("/verify_email", emailVerify);

// 2️⃣ Send OTP (rate-limited)
forgotPassRoute.post("/send_otp/:id", otpSendLimiter, sendOtp);

// 3️⃣ Verify OTP → issue reset token (rate-limited)
forgotPassRoute.post("/verify_otp", otpVerifyLimiter, verifyOtp);

// 4️⃣ Reset password (rate-limited)
forgotPassRoute.post("/forgot_pass", passwordResetLimiter, forgetUserPass);

// 5️⃣ Check reset session (ANTI-BURP / stage-3 protection)
forgotPassRoute.get("/reset-session-check", checkResetSession);

module.exports = forgotPassRoute;