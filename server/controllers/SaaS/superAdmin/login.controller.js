const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectMasterDB = require("../../../config/SaaS/masterDb");
const SuperAdminModel = require("../../../models/SaaS/master/SuperAdmin");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// cookie config (same as your SaaS)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "None",
  path: "/",
};

if (process.env.NODE_ENV === "production") {
  cookieOptions.domain = ".imsmymunc.com";
}

exports.superAdminLogin = async (req, res, next) => {
  try {
    let { email, password, rememberMe } = req.body;

    // ✅ validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    email = String(email).trim().toLowerCase();

    const masterDB = await connectMasterDB();
    const SuperAdmin = SuperAdminModel(masterDB);

    const admin = await SuperAdmin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ account status check
    if (admin.status === "Inactive") {
      return res.status(403).json({
        message: "Account is inactive. Contact support.",
      });
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ update last login
    await SuperAdmin.updateOne(
      { _id: admin._id },
      { $set: { lastLogin: new Date() } }
    );

    // ✅ generate token
    const token = jwt.sign(
      {
        adminId: admin._id,
        email: admin.email,
        role: "SUPER_ADMIN",
      },
      JWT_SECRET,
      {
        expiresIn: rememberMe ? "7d" : "1d",
      }
    );

    const finalCookieOptions = {
      ...cookieOptions,
      maxAge: rememberMe
        ? 7 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000,
    };

    // ✅ set cookie (important for SaaS)
    res.cookie("token", token, finalCookieOptions);
    res.cookie("adminId", admin._id.toString(), finalCookieOptions);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        status: admin.status,
      },
    });
  } catch (err) {
    console.error("Super admin login error:", err);
    next(err);
  }
};