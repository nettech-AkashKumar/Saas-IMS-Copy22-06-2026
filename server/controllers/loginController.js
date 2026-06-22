const User = require("../Modals/userModal.js");
const bcrypt = require("bcryptjs");
const sendEmail = require("../config/sendEmail.js");
const DeviceSession = require("../Modals/DeviceManagementmodal.js");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// ==============================
// ✅ LOGIN USER (SaaS READY)
// ==============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account inactive",
        code: "ACCOUNT_INACTIVE",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // ==============================
    // ✅ 2FA (OTP FLOW)
    // ==============================
    if (user.twoFactorEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000);
      const hashedOtp = await bcrypt.hash(String(otp), 10);

      user.otp = hashedOtp;
      user.otpExpires = Date.now() + 5 * 60 * 1000;
      await user.save();

      await sendEmail(email, "Your Login OTP", `Your OTP is: ${otp}`);

      return res.status(200).json({
        message: "OTP sent",
        twoFactor: true,
        email: user.email,
        userId: user._id,
        subdomain: user.subdomain || null,
        dbName: user.dbName || null,
      });
    }

    // ==============================
    // ✅ NORMAL LOGIN (NO OTP)
    // ==============================
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ COOKIE (IMPORTANT FOR AWS + SUBDOMAIN)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on AWS
      sameSite: "none", // REQUIRED for cross-domain
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      subdomain: user.subdomain || null,
      dbName: user.dbName || null,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
};

// ==============================
// ✅ VERIFY OTP
// ==============================
const verifyotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isOtpValid = await bcrypt.compare(String(otp), user.otp);

    if (!isOtpValid || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // ✅ Generate token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });

    return res.status(200).json({
      message: "OTP verified",
      token,
      subdomain: user.subdomain || null,
      dbName: user.dbName || null,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ OTP error:", error);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};

// ==============================
// ✅ DEVICE LOGGING
// ==============================
const logDevice = async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    let ip =
      (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
        .split(",")[0]
        .trim();

    const userAgent = req.headers["user-agent"];

    let device = "Unknown";

    try {
      const browserName = userAgent.split("/")[0];
      const osMatch = userAgent.match(/\(([^)]+)\)/);
      const os = osMatch ? osMatch[1].split(";")[0].trim() : "Unknown";

      device = `${browserName} ${os}`;
    } catch {}

    let location = "Unknown";

    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      ip = "127.0.0.1";
      location = "Localhost";
    } else {
      try {
        const { data } = await axios.get(`https://ipapi.co/${ip}/json/`);
        location = `${data.city}, ${data.country_name}`;
      } catch {}
    }

    await DeviceSession.create({
      userId,
      device,
      ipAddress: ip,
      location,
      latitude,
      longitude,
    });

    return res.status(200).json({ message: "Device logged" });
  } catch (error) {
    console.error("❌ Device log error:", error);
    return res.status(500).json({ message: "Device logging failed" });
  }
};

module.exports = {
  loginUser,
  verifyotp,
  logDevice,
};