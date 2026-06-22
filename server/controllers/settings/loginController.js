const User = require("../../models/usersModels.js");
const bcrypt = require("bcryptjs");
const sendEmail = require("../config/sendEmail.js");
const DeviceSession = require("../../models/settings/DeviceManagementmodal.js");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// ==============================
// ✅ LOGIN USER
// ==============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is deactivated",
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

    // =========================
    // ✅ OTP FLOW
    // =========================
    if (user.twoFactorEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000);

      user.otp = await bcrypt.hash(String(otp), 10);
      user.otpExpires = Date.now() + 5 * 60 * 1000;

      await user.save();

      await sendEmail(email, "Login OTP", `Your OTP is: ${otp}`);

      return res.status(200).json({
        message: "OTP sent",
        twoFactor: true,
        email: user.email,
        userId: user._id,
        subdomain: user.subdomain || null,
        dbName: user.dbName || null,
      });
    }

    // =========================
    // ✅ NORMAL LOGIN
    // =========================
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ COOKIE (VERY IMPORTANT)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
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
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ COOKIE
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
    return res.status(500).json({
      message: "OTP verification failed",
    });
  }
};

// ==============================
// ✅ DEVICE LOG
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
      const browser = userAgent.split("/")[0];
      const osMatch = userAgent.match(/\(([^)]+)\)/);
      const os = osMatch ? osMatch[1] : "Unknown";

      device = `${browser} ${os}`;
    } catch {}

    let location = "Unknown";

    if (ip.includes("127.0.0.1") || ip === "::1") {
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
    return res.status(500).json({ message: "Device log failed" });
  }
};

module.exports = { loginUser, verifyotp, logDevice };