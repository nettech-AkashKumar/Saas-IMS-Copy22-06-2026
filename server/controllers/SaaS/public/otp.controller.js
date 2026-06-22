// src/controllers/public/otp.controller.js

const bcrypt = require("bcryptjs");
const OtpModel = require("../../../models/SaaS/master/Otp.model");
const connectMasterDB = require("../../../config/SaaS/masterDb");
const { sendMail } = require("../../../utils/SaaS/sendMail");

// Generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================
// SEND OTP
// ============================
exports.sendOtpToEmail = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    email = String(email).trim().toLowerCase();

    const masterConn = await connectMasterDB();
    const Otp = OtpModel(masterConn);

    // 🚫 Prevent spam: enforce resend interval
    const existingOtp = await Otp.findOne({ email });

    const RESEND_INTERVAL_MS = 60 * 1000;
    if (existingOtp) {
      const resendAvailableAt = new Date(
        existingOtp.createdAt.getTime() + RESEND_INTERVAL_MS,
      );
      if (resendAvailableAt > new Date()) {
        return res.status(429).json({
          message: "OTP already sent. Please wait before requesting again.",
        });
      }
    }

    // Clean old OTPs
    await Otp.deleteMany({ email });

    const otp = generateOtp();

    // 🔐 Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
    });

    // 📧 Send Email
    await sendMail({
      to: email,
      subject: "Your OTP Code",
      html: `
        <h3>Your OTP is: <b>${otp}</b></h3>
        <p>This code is valid for 5 minutes.</p>
      `,
    });

    return res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ============================
// VERIFY OTP
// ============================
exports.verifyOtpForEmail = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    email = String(email).trim().toLowerCase();

    const masterConn = await connectMasterDB();
    const Otp = OtpModel(masterConn);

    const otpDoc = await Otp.findOne({ email });

    if (!otpDoc) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ⛔ Expired
    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    // ⛔ Too many attempts
    if (otpDoc.attempts >= 5) {
      await Otp.deleteMany({ email });
      return res.status(429).json({ message: "Too many attempts" });
    }

    // 🔐 Compare hashed OTP
    const isMatch = await bcrypt.compare(String(otp), otpDoc.otp);

    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();

      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Success
    await Otp.deleteMany({ email });

    return res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};