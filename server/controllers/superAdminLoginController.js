const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectMasterDB = require("../config/SaaS/masterDb");
const SuperAdminModel = require("../models/SaaS/master/SuperAdmin");

// ============================
// ✅ SUPER ADMIN LOGIN
// ============================
exports.superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ✅ Connect to master DB
    const masterDB = await connectMasterDB();
    const SuperAdmin = SuperAdminModel(masterDB);

    // ✅ Find super admin by email
    const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });

    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Verify password
    const isPasswordValid = await bcrypt.compare(password, superAdmin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      {
        adminId: superAdmin._id,
        email: superAdmin.email,
        role: "SUPER_ADMIN",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // ✅ Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(200).json({
      success: true,
      message: "Super Admin login successful",
      token,
      user: {
        _id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: "SUPER_ADMIN",
      },
    });
  } catch (error) {
    console.error("Super Admin Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// ============================
// ✅ SUPER ADMIN LOGOUT
// ============================
exports.superAdminLogout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};
