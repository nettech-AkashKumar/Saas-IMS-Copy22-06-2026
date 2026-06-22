const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectMasterDB = require("../../../config/SaaS/masterDb");
const getTenantDB = require("../../../config/SaaS/tenantDb");
const SuperAdminModel = require("../../../models/SaaS/master/SuperAdmin");
const CompanyModel = require("../../../models/SaaS/master/Company.model");
const User = require("../../../models/usersModels");
const RoleModel = require("../../../models/roleModels");
const sendEmail = require("../../../utils/sendEmail");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "None",
  path: "/",
};

if (process.env.NODE_ENV === "production") {
  cookieOptions.domain = ".imsmymunc.com";
}

// ======================
// HELPER: CREATE TOKEN
// ======================
const generateToken = (payload, rememberMe) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? "7d" : "1d",
  });
};

const getCookieOptions = (rememberMe) => ({
  ...cookieOptions,
  maxAge: rememberMe
    ? 7 * 24 * 60 * 60 * 1000
    : 24 * 60 * 60 * 1000,
});

// ======================
// UNIFIED LOGIN
// ======================
exports.allLogin = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const { rememberMe, deviceId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const masterConn = await connectMasterDB();
    const Company = CompanyModel(masterConn);
    const SuperAdmin = SuperAdminModel(masterConn);

    // ================= SUPER ADMIN =================
    const admin = await SuperAdmin.findOne({ email });

    if (admin) {
      if (admin.status === "Inactive") {
        return res.status(403).json({ message: "Account inactive" });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await SuperAdmin.updateOne(
        { _id: admin._id },
        { $set: { lastLogin: new Date() } }
      );

      const token = generateToken(
        {
          adminId: admin._id,
          role: "SUPER_ADMIN",
        },
        rememberMe
      );

      res.cookie("token", token, getCookieOptions(rememberMe));

      return res.status(200).json({
        message: "Login successful",
        token,
        user: admin,
      });
    }

    // ================= TENANT =================

    let companies = await Company.find({
      $or: [{ adminEmail: email }, { companyEmail: email }],
    });

    if (!companies.length) {
      companies = await Company.find({});
    }

    for (const company of companies) {
      try {
        const tenantConn = await getTenantDB(company.dbName);
        const Employee = User.forTenant(tenantConn);
        const TenantRole = RoleModel.forTenant(tenantConn);

        const user = await Employee.findOne({ email }).populate(
          "role",
          null,
          TenantRole
        );

        if (!user) continue;

        if (!company.isActive || user.status === "Inactive") {
          return res.status(403).json({ message: "Account inactive" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) continue;

        await Employee.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date() } }
        );

        const isTrusted = user.trustedDevices?.some(
          (d) => d.deviceId === deviceId
        );

        // ================= DIRECT LOGIN =================
        if (!user.twoFactorEnabled || isTrusted) {
          const token = generateToken(
            {
              id: user._id,
              companyId: company._id,
              dbName: company.dbName,
            },
            rememberMe
          );

          res.cookie("token", token, getCookieOptions(rememberMe));

          return res.status(200).json({
            message: "Login successful",
            token,
            user,
            subdomain: company.subdomain,
          });
        }

        // ================= OTP FLOW =================
        const otp = Math.floor(100000 + Math.random() * 900000);

        user.otp = await bcrypt.hash(String(otp), 10);
        user.otpExpires = Date.now() + 5 * 60 * 1000;

        await user.save();

        await sendEmail(user.email, "Login OTP", `OTP: ${otp}`);

        return res.status(200).json({
          message: "OTP sent",
          twoFactor: true,
          email: user.email,
          companyId: company._id,
          dbName: company.dbName,
        });
      } catch (err) {
        console.log("Tenant error:", err.message);
      }
    }

    return res.status(401).json({ message: "Invalid credentials" });
  } catch (err) {
    console.error("Login error:", err);
    next(err);
  }
};

// ======================
// VERIFY OTP (VERY IMPORTANT)
// ======================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, dbName, rememberMe } = req.body;

    const tenantConn = await getTenantDB(dbName);
    const Employee = User.forTenant(tenantConn);

    const user = await Employee.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(String(otp), user.otp);

    if (!isValid || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // clear otp
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = generateToken(
      {
        id: user._id,
        dbName,
      },
      rememberMe
    );

    res.cookie("token", token, getCookieOptions(rememberMe));

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    console.error("OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ======================
// TENANT LOGIN (DIRECT)
// ======================
exports.loginTenant = async (req, res, next) => {
  try {
    const { email, password, subdomain, rememberMe } = req.body;

    const masterConn = await connectMasterDB();
    const Company = CompanyModel(masterConn);

    const company = await Company.findOne({ subdomain });
    if (!company) return res.status(404).json({ message: "Company not found" });

    const tenantConn = await getTenantDB(company.dbName);
    const Employee = User.forTenant(tenantConn);

    const user = await Employee.findOne({ email });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(
      {
        id: user._id,
        dbName: company.dbName,
      },
      rememberMe
    );

    res.cookie("token", token, getCookieOptions(rememberMe));

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    console.error("Tenant login error:", err);
    next(err);
  }
};