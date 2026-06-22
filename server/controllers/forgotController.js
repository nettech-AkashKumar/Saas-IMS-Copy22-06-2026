// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");
// const User = require("../models/usersModels");
// const Otp = require("../models/otpModels");
// const sendEmail = require("../utils/sendEmail");
// const cookieOptions = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
//   path: "/",
//   maxAge: 24 * 60 * 60 * 1000,
// };

// // FORGOT PASSWORD
// exports.forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const normalizedEmail =
//       typeof email === "string" ? email.toLowerCase() : email;
//     const user = await User.findOne({ email: normalizedEmail });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const now = Date.now();

//     if (
//       user.resetRequestBlockedUntil &&
//       user.resetRequestBlockedUntil.getTime() > now
//     ) {
//       return res
//         .status(429)
//         .json({ message: "Too many reset requests. Try again after 5 minutes" });
//     }

//     if (
//       !user.resetRequestWindowStart ||
//       now - user.resetRequestWindowStart.getTime() > 60 * 1000
//     ) {
//       user.resetRequestWindowStart = new Date(now);
//       user.resetRequestCount = 0;
//     }

//     if (user.resetRequestCount >= 5) {
//       user.resetRequestBlockedUntil = new Date(now + 5 * 60 * 1000);
//       await user.save();
//       return res
//         .status(429)
//         .json({ message: "Too many reset requests. Try again after 5 minutes" });
//     }

//     user.resetRequestCount += 1;
//     await user.save();

//     const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

//     await Otp.deleteMany({ email: normalizedEmail });

//     const otp = new Otp({ email: normalizedEmail, otp: otpCode });
//     await otp.save();

//     await sendEmail(
//       normalizedEmail,
//       "OTP for Password Reset",
//       `Your OTP is: ${otpCode}`
//     );

//     res.status(200).json({ message: "OTP sent to registered email" });
//   } catch (error) {
//     console.error("Error sending OTP:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // verify otp and  check otp
// exports.verifyOtpCheck = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     const normalizedEmail =
//       typeof email === "string" ? email.toLowerCase().trim() : email;

//     const validOtp =
//       (await Otp.findOne({ email: normalizedEmail, otp })) ||
//       (await Otp.findOne({
//         email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
//         otp,
//       }));
//     if (!validOtp) {
//       return res.status(400).json({ message: "Invalid or expired OTP" });
//     }

//     // Check expiry
//     if (validOtp.expiresAt < Date.now()) {
//       return res.status(400).json({ message: "OTP expired" });
//     }

//     const user = await User.findOne({ email: normalizedEmail });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const rawToken = crypto.randomBytes(32).toString("hex");
//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(rawToken)
//       .digest("hex");

//     user.resetToken = hashedToken;
//     user.resetTokenExpire = new Date(Date.now() + 15 * 60 * 1000);
//     await user.save();

//     res.cookie("reset_token", rawToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
//       path: "/",
//       maxAge: 15 * 60 * 1000,
//     });

//     res.status(200).json({ message: "OTP Verified successfully" });
//   } catch (error) {
//     console.error("OTP verification error", error);
//     res.status(500).json({ message: "Server error during OTP verification" });
//   }
// };

// exports.checkResetSession = async (req, res) => {
//   try {
//     const token = req.cookies?.reset_token;
//     if (!token) {
//       return res
//         .status(401)
//         .json({ message: "Invalid or expired reset session" });
//     }

//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(token)
//       .digest("hex");

//     const user = await User.findOne({
//       resetToken: hashedToken,
//       resetTokenExpire: { $gt: Date.now() },
//     });

//     if (!user) {
//       res.clearCookie("reset_token", { path: "/" });
//       return res
//         .status(401)
//         .json({ message: "Invalid or expired reset session" });
//     }

//     res.status(200).json({ message: "Reset session valid" });
//   } catch (error) {
//     console.error("Reset session check error", error);
//     res.status(500).json({ message: "Server error during reset session check" });
//   }
// };

// exports.verifyOtpAndReset = async (req, res) => {
//   const { newPassword } = req.body;

//   try {
//     const token = req.cookies?.reset_token;
//     if (!token) {
//       return res
//         .status(401)
//         .json({ message: "Invalid or expired reset session" });
//     }

//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(token)
//       .digest("hex");

//     const user = await User.findOne({
//       resetToken: hashedToken,
//       resetTokenExpire: { $gt: Date.now() },
//     });

//     if (!user) {
//       res.clearCookie("reset_token", { path: "/" });
//       return res
//         .status(401)
//         .json({ message: "Invalid or expired reset session" });
//     }

//     user.password = await bcrypt.hash(newPassword, 10);
//     user.passwordChangedAt = new Date();
//     user.resetToken = undefined;
//     user.resetTokenExpire = undefined;
//     await user.save();

//     await Otp.deleteMany({ email: user.email });

//     res.clearCookie("reset_token", { path: "/" });

//     res.status(200).json({ message: "Password reset successful" });
//   } catch (error) {
//     console.error("Error resetting password:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // this is for two factor auth
// exports.verifyotp = async (req, res) => {
//   try {
//     // 🔐 OTP session check
//     if (!req.cookies.otpPending) {
//       return res.status(401).json({
//         message: "OTP session expired. Please login again.",
//       });
//     }

//     const { email, otp, deviceId, deviceInfo } = req.body;

//     const user = await User.findOne({ email: email.toLowerCase() }).populate(
//       "role"
//     );
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (String(user.otp) !== String(otp) || user.otpExpires < Date.now()) {
//       return res.status(400).json({ message: "Invalid or expired OTP" });
//     }

//     // Clear OTP
//     user.otp = null;
//     user.otpExpires = null;

//     if (deviceId && !user.trustedDevices.some((d) => d.deviceId === deviceId)) {
//       user.trustedDevices.push({ deviceId, deviceInfo });
//     }

//     await user.save();

//     // ✅ CLEAR otpPending (IMPORTANT)
//     res.clearCookie("otpPending");
//     res.clearCookie("otpEmail");

//     const roleData = user.role
//       ? {
//         roleName: user.role.roleName,
//         modulePermissions: Object.fromEntries(
//           user.role.modulePermissions || []
//         ),
//       }
//       : null;

//     const token = jwt.sign(
//       { id: user._id, email: user.email, role: roleData },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     const twoFAToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "7d",
//     });
//     // ✅ ADD userId cookie that your frontend expects
//     const cookieOptions = {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
//       path: "/",
//       maxAge: 24 * 60 * 60 * 1000, // 24 hours
//     };

//     res.cookie("token", token, cookieOptions);
//     res.cookie("twoFAToken", twoFAToken, cookieOptions);
//     // ✅ SET USER ID COOKIE
//     res.cookie("userId", user._id.toString(), {
//       httpOnly: false, // Allow frontend to read
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
//       maxAge: 24 * 60 * 60 * 1000,
//       path: "/",
//     });

//     // After setting cookies, add:
//     console.log("✅ OTP Verification - Cookies set:", {
//       tokenSet: !!token,
//       twoFATokenSet: !!twoFAToken,
//       userIdSet: !!user._id,
//       cookieOptions: cookieOptions
//     });

//     res.status(200).json({
//       message: "OTP Verified successfully",
//       user: {
//         _id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         phone: user.phone,
//         profileImage: user.profileImage,
//         status: user.status,
//         role: roleData,
//       },
//     });
//   } catch (error) {
//     console.error("OTP verification error", error);
//     res.status(500).json({ message: "Server error during OTP verification" });
//   }
// };

// exports.resendOtp = async (req, res) => {
//   try {
//     // FIX: Get email from request body OR cookie
//     let email = req.body.email;

//     // If no email in request body, try to get from cookie
//     if (!email && req.cookies.otpEmail) {
//       email = req.cookies.otpEmail;
//       console.log("Got email from cookie:", email);
//     }

//     if (!email) {
//       return res.status(400).json({
//         message: "Email required. Please login again.",
//       });
//     }
//     const user = await User.findOne({ email: email.toLowerCase() });

//     if (!user) return res.status(404).json({ message: "User not found" });

//     if (!user.twoFactorEnabled) {
//       return res
//         .status(400)
//         .json({ message: "Two factor is not enabled for this user" });
//     }

//     // Generate new OTP
//     const otp = Math.floor(100000 + Math.random() * 900000);
//     const expiry = Date.now() + 5 * 60 * 1000;
//     user.otp = otp;
//     user.otpExpires = expiry;
//     await user.save();
//     await sendEmail(email, "Your Login OTP", `Your OTP code is: ${otp}`);
//     // Also reset/update the cookie timer
//     res.cookie("otpPending", "true", {
//       httpOnly: false,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "None",
//       maxAge: 5 * 60 * 1000,
//       path: "/",
//     });

//     res.status(200).json({
//       message: "OTP resent to your email",
//       email: email,
//     });
//   } catch (error) {
//     console.error("Resend OTP error:", error);
//     res.status(500).json({ message: "Server error during OTP resend" });
//   }
// };


// =====================
//  💀 New Code       //--------------------------------------------------------------------------------------------
// =====================

const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const sendEmail = require("../utils/sendEmail");
// const { success, error } = require("../utils/CustomError");

const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();

const SALT_FECTOUR = Number(process.env.SALT_FECTOUR) || 10;
const OTP_EXPIRY_SECONDS = Number(process.env.OTP_EXPIRY_SECONDS) || 180;
const RESET_SESSION_TTL_MS = Number(process.env.RESET_TOKEN_TTL_MS) || 15 * 60 * 1000;
const MAX_OTP_RETRIES = Number(process.env.MAX_OTP_RETRIES) || 5;
const OTP_BLOCK_DURATION_MS = Number(process.env.OTP_BLOCK_DURATION_MS) || 60 * 1000;

// =====================
// HELPERS
// =====================
const sendError = (res, code, message) => res.status(code).json({ success: false, message });
const sendSuccess = (res, code, data) => res.status(code).json({ success: true, ...data });

// =====================
// 1️⃣ VERIFY EMAIL
// =====================
const emailVerify = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, "Email is required");

    const { User } = await getAutoModels(req);
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "-password"
    );
    if (!user) return sendError(res, 404, "Invalid email");

    return sendSuccess(res, 200, { message: "Email verified", userId: user._id });
  } catch (err) {
      next(err); // Pass error to global error handler
    console.error("emailVerify:", err);
    return sendError(res, 500, "Server error");
  }
};

// =====================
// 2️⃣ SEND OTP
// =====================
const sendOtp = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return sendError(res, 400, "User ID required");

    const { User, Otp } = await getAutoModels(req);
    const user = await User.findById(id);
    if (!user) return sendError(res, 404, "User not found");

    let record = await Otp.findOne({ userId: id });

    if (record?.blockedUntil > Date.now()) {
      const sec = Math.ceil((record.blockedUntil - Date.now()) / 1000);
      return sendError(res, 429, `Try again after ${sec}s`);
    }

    if (record?.expiresAt > Date.now() && record.otp) {
      const sec = Math.ceil((record.expiresAt - Date.now()) / 1000);
      return sendError(res, 429, `Wait for ${sec}s`);
    }

    const otp = crypto.randomInt(1000, 9999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.findOneAndUpdate(
      { userId: id },
      {
        otp: hashedOtp,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000),
        retryCount: 0,
        blockedUntil: null,
        resetSessionHash: null,         // Invalidate old reset sessions
        resetSessionExpires: null,
      },
      { upsert: true, new: true }
    );

    await sendEmail(
      user.email,
      "OTP for Password Reset",
      `Your OTP is: ${otp}`
    );

    return sendSuccess(res, 200, { message: "OTP sent", expiresIn: OTP_EXPIRY_SECONDS });
  } catch (err) {
      next(err); // Pass error to global error handler
    console.error("sendOtp:", err);
    return sendError(res, 500, "Failed to send OTP");
  }
};

// =====================
// 3️⃣ VERIFY OTP & ISSUE RESET SESSION
// =====================
const mongoose = require("mongoose"); // for ObjectId validation

const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    // 1️⃣ Validate presence
    if (!userId || !otp) return sendError(res, 400, "Invalid request");

    // 2️⃣ Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, "Invalid userId format");
    }

    // 3️⃣ Fetch OTP record
    const { Otp } = await getAutoModels(req);
    const record = await Otp.findOne({ userId });
    if (!record || record.expiresAt < Date.now() || !record.otp)
      return sendError(res, 410, "OTP expired");

    // 4️⃣ Verify OTP
    const validOtp = await bcrypt.compare(otp, record.otp);
    if (!validOtp) {
      record.retryCount++;
      if (record.retryCount >= MAX_OTP_RETRIES) {
        record.blockedUntil = new Date(Date.now() + OTP_BLOCK_DURATION_MS);
      }
      await record.save();
      return sendError(res, 400, "Invalid OTP");
    }

    // 5️⃣ Clear OTP & create reset session
    record.otp = null;
    record.expiresAt = null;
    record.retryCount = 0;
    record.blockedUntil = null;

    const resetSession = crypto.randomBytes(64).toString("hex");
    record.resetSessionHash = await bcrypt.hash(resetSession, 10);
    record.resetSessionExpires = new Date(Date.now() + RESET_SESSION_TTL_MS);

    await record.save();

    // 6️⃣ Set secure HttpOnly cookie
    res.cookie("reset_session", resetSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: RESET_SESSION_TTL_MS,
    });

    return sendSuccess(res, 200, { message: "OTP verified" });
  } catch (err) {
    next(err); // Pass error to global error handler
    console.error("verifyOtp:", err);
    return sendError(res, 500, "OTP verification failed");
  }
};

// =====================
// 4️⃣ CHECK RESET SESSION
// =====================
const checkResetSession = async (req, res, next) => {
  try {
    const token = req.cookies.reset_session;
    if (!token) return sendError(res, 401, "Invalid reset session");

    const { Otp } = await getAutoModels(req);
    const record = await Otp.findOne({
      resetSessionExpires: { $gt: Date.now() },
      resetSessionHash: { $ne: null },
    });

    if (!record) return sendError(res, 401, "Reset session expired");

    const valid = await bcrypt.compare(token, record.resetSessionHash);
    if (!valid) return sendError(res, 401, "Invalid reset session");

    return sendSuccess(res, 200, { message: "Session valid" });
  } catch (err) {
    next(err); // Pass error to global error handler
    console.error("checkResetSession:", err);
    return sendError(res, 500, "Session validation failed");
  }
};

// =====================
// 5️⃣ RESET PASSWORD
// =====================
const forgetUserPass = async (req, res, next) => {
  try {
    const { pass, confirm_pass } = req.body;
    const token = req.cookies.reset_session;

    if (!token) return sendError(res, 401, "Reset session missing");
    if (!pass || pass !== confirm_pass)
      return sendError(res, 400, "Password mismatch");

    const { Otp, User } = await getAutoModels(req);
    const record = await Otp.findOne({
      resetSessionExpires: { $gt: Date.now() },
      resetSessionHash: { $ne: null },
    });

    if (!record) return sendError(res, 401, "Reset session expired");

    const valid = await bcrypt.compare(token, record.resetSessionHash);
    if (!valid) return sendError(res, 401, "Invalid reset session");

    const hashed = await bcrypt.hash(pass, SALT_FECTOUR);
    await User.findByIdAndUpdate(record.userId, { password: hashed });

    // 🔒 HARD INVALIDATION
    record.resetSessionHash = null;
    record.resetSessionExpires = null;
    await record.save();

    res.clearCookie("reset_session");

    return sendSuccess(res, 200, { message: "Password updated" });
  } catch (err) {
    next(err); // Pass error to global error handler
    console.error("forgetUserPass:", err);
    return sendError(res, 500, "Password reset failed");
  }
};

module.exports = {
  emailVerify,
  sendOtp,
  verifyOtp,
  checkResetSession,
  forgetUserPass,
};
