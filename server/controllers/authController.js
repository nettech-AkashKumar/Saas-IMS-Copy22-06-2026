const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/usersModels");
const RoleModel = require("../models/roleModels");
const axios = require("axios");
const DeviceSession = require("../models/settings/DeviceManagementmodal");
const sendEmail = require("../utils/sendEmail");

// SaaS imports
const connectMasterDB = require("../config/SaaS/masterDb");
const getTenantDB = require("../config/SaaS/tenantDb");
const SuperAdminModel = require("../models/SaaS/master/SuperAdmin");
const CompanyModel = require("../models/SaaS/master/Company.model");

const cookieOptionsBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/",
};

const buildCookieOptions = (req, overrides = {}) => {
  const options = { ...cookieOptionsBase, ...overrides };

  if (process.env.NODE_ENV === "production" && req?.hostname) {
    options.domain = req.hostname.toLowerCase();
  }

  return options;
};

const isUserAccountBlocked = (status) => {
  if (!status) return false;
  const normalized = String(status).trim().toLowerCase();
  return normalized !== "active";
};

const getBlockedAccountMessage = (status) => {
  if (!status) return "Your account is inactive. Please contact admin.";

  const normalized = String(status).trim().toLowerCase();
  if (normalized === "inactive") {
    return "Your account has been deactivated. Please contact admin.";
  }
  if (normalized === "blacklist" || normalized === "blacklisted") {
    return "Your account has been blacklisted. Please contact admin.";
  }

  return "Your account is inactive. Please contact admin.";
};

exports.loginUser = async (req, res, next) => {
  const { email, password, deviceId, deviceInfo, rememberMe, subdomain } = req.body;

  try {
    const emailLower = String(email || "").trim().toLowerCase();
    const passwordStr = String(password || "");

    if (!emailLower || !passwordStr) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const masterConn = await connectMasterDB();
    const Company = CompanyModel(masterConn);
    const SuperAdmin = SuperAdminModel(masterConn);

    // ========================================
    // 1️⃣ SUPER ADMIN LOGIN (if no subdomain provided)
    // ========================================
    if (!subdomain) {
      const admin = await SuperAdmin.findOne({ email: emailLower });
      if (admin) {
        // Check if admin is inactive
        if (admin.status === "Inactive") {
          return res.status(403).json({
            message: "Your account is inactive. Please contact support.",
            code: "ACCOUNT_INACTIVE",
          });
        }

        const isAdminMatch = await bcrypt.compare(passwordStr, admin.password);
        if (!isAdminMatch) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Update last login
        await SuperAdmin.updateOne(
          { _id: admin._id },
          { $set: { lastLogin: new Date() } }
        );

        const tokenPayload = {
          adminId: admin._id,
          email: admin.email,
          role: "SUPER_ADMIN",
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
          expiresIn: rememberMe ? "7d" : "1d",
        });

        const finalCookieOptions = buildCookieOptions(req, {
          maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
        });

        res.cookie("token", token, finalCookieOptions);
        res.cookie("userId", admin._id.toString(), finalCookieOptions);

        return res.status(200).json({
          message: "Login successful",
          role: "SUPER_ADMIN",
          token,
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone || "",
            status: admin.status,
          },
          redirectPath: "/admin/dashboard",
        });
      }
    }

    // ========================================
    // 2️⃣ TENANT LOGIN (by subdomain only)
    // ========================================
    if (!subdomain) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const hostHeader = String(req.headers.host || "").split(":")[0].toLowerCase();
    const currentSubdomain = hostHeader.includes(".") ? hostHeader.split(".")[0] : hostHeader;
    const skipDomains = ["localhost", "127", "www", "admin", "mymunc"];

    if (
      currentSubdomain &&
      !skipDomains.includes(currentSubdomain) &&
      currentSubdomain !== subdomain.toLowerCase()
    ) {
      return res.status(403).json({
        message: "Tenant login must be performed from the tenant's own subdomain.",
      });
    }

    const company = await Company.findOne({ subdomain: subdomain.toLowerCase() });
    if (!company) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tenantConn = await getTenantDB(company.dbName);
    const Employee = User.forTenant(tenantConn);
    const TenantRole = RoleModel.forTenant(tenantConn);

    const user = await Employee.findOne({ email: emailLower }).populate("role", null, TenantRole);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!company.isActive) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact your service provider.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    if (isUserAccountBlocked(user.status)) {
      return res.status(403).json({
        message: getBlockedAccountMessage(user.status),
        code: "ACCOUNT_INACTIVE",
      });
    }

    const isMatch = await bcrypt.compare(passwordStr, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await Employee.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    const isTrustedDevice = user.trustedDevices.some(
      (d) => d.deviceId === deviceId
    );

    const roleData = user.role
      ? {
          roleName: user.role.roleName,
          modulePermissions: Object.fromEntries(
            user.role.modulePermissions || []
          ),
        }
      : null;

    const tokenPayload = {
      id: user._id,
      email: user.email,
      companyId: company._id,
      subdomain: company.subdomain,
      dbName: company.dbName,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: rememberMe ? "7d" : "1d",
    });

    const finalCookieOptions = buildCookieOptions(req, {
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    if (!user.twoFactorEnabled || (user.twoFactorEnabled && isTrustedDevice)) {
      res.cookie("token", token, finalCookieOptions);
      res.cookie("userId", user._id, finalCookieOptions);
      res.cookie("subdomain", company.subdomain, { ...finalCookieOptions, httpOnly: false });

      return res.status(200).json({
        message: "Login successful(trusted device)",
        role: "TENANT",
        token,
        user: {
          id: user._id,
          name: user.name || user.username,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          status: user.status,
          role: roleData,
        },
        subdomain: company.subdomain,
        dbName: company.dbName,
        redirectPath: "/dashboard",
      });
    }

    const now = Date.now();
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiry = now + 5 * 60 * 1000;
    user.otp = String(otp);
    user.otpExpires = expiry;
    await user.save();

    await sendEmail(emailLower, "your Login OTP", `your OTP code is: ${otp}`);

    res.cookie("otpPending", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 5 * 60 * 1000,
      path: "/",
    });

    res.cookie("otpEmail", user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 5 * 60 * 1000,
      path: "/",
    });

    res.cookie("subdomain", company.subdomain, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 5 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "OTP sent to your email",
      twoFactor: true,
      email: user.email,
      userId: user._id.toString(),
      subdomain: company.subdomain,
      dbName: company.dbName,
    });

    return res.status(401).json({ message: "Invalid credentials" });

  } catch (err) {
    console.error("Login error:", err.message);
    next(err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
// LOGOUT
exports.logoutUser = async (req, res, next) => {
  try {
    const clearOptions = buildCookieOptions(req);

    // For JWT, you usually handle logout on client side
    res.clearCookie("token", clearOptions);
    res.clearCookie("userId", clearOptions);
    res.clearCookie("twoFAToken", clearOptions);
    res.clearCookie("subdomain", { path: "/" });
    res.clearCookie("otpPending", { path: "/" });
    res.clearCookie("otpEmail", { path: "/" });
    res.clearCookie("user", { path: "/" });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error); // Pass error to global error handler
    // console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyAdminPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Password is required" });
    }

    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let passwordHash = null;

    if (currentUser.userType === "SUPER_ADMIN") {
      const SuperAdmin = SuperAdminModel(req.db);
      const admin = await SuperAdmin.findById(currentUser._id).select("password").lean();
      passwordHash = admin?.password;
    } else if (currentUser.userType === "MASTER_USER") {
      const MasterUserModel = User.forMaster(req.db);
      const masterUser = await MasterUserModel.findById(currentUser._id).select("password").lean();
      passwordHash = masterUser?.password;
    } else if (currentUser.userType === "TENANT_USER") {
      const Employee = User.forTenant(req.db);
      const tenantUser = await Employee.findById(currentUser._id).select("password").lean();
      passwordHash = tenantUser?.password;
    } else {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (!passwordHash) {
      return res.status(404).json({ message: "User password not found" });
    }

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    return res.status(200).json({ message: "Password verified successfully", verified: true });
  } catch (error) {
    console.error("verifyAdminPassword error:", error);
    next(error);
    return res.status(500).json({ message: "Server error" });
  }
};
// verify otp
exports.verifyotp = async (req, res, next) => {
  try {
    const { email, otp, deviceId, deviceInfo, rememberMe, subdomain, dbName } = req.body;
    
    let user;
    let Employee;
    let isTenant = false;
    let company = null;

    // ✅ Determine if tenant or master based on subdomain/dbName
    if (subdomain && dbName) {
      // TENANT OTP verification
      try {
        const masterConn = await connectMasterDB();
        const Company = CompanyModel(masterConn);
        company = await Company.findOne({ subdomain, dbName });
        if (!company) {
          return res.status(404).json({ message: "Company not found" });
        }
        const tenantConn = await getTenantDB(dbName);
        Employee = User.forTenant(tenantConn);
        const TenantRole = RoleModel.forTenant(tenantConn);
        user = await Employee.findOne({ email: email.toLowerCase() }).populate("role", null, TenantRole);
        isTenant = true;
      } catch (tenantErr) {
        console.error("Tenant lookup error:", tenantErr);
        return res.status(500).json({ message: "Could not verify tenant" });
      }
    } else {
      // MASTER OTP verification
      const masterConn = await connectMasterDB();
      const MasterUserModel = User.forMaster(masterConn);
      const MasterRoleModel = RoleModel.forMaster(masterConn);
      user = await MasterUserModel.findOne({ email: email.toLowerCase() }).populate("role", null, MasterRoleModel);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isUserAccountBlocked(user.status)) {
      return res.status(403).json({
        message: getBlockedAccountMessage(user.status),
        code: "ACCOUNT_INACTIVE",
      });
    }
    
    // Convert both to strings for comparison (safe comparison)
    const receivedOtpStr = String(otp).trim();
    const storedOtpStr = String(user.otp).trim();
    
    const isOtpValid = receivedOtpStr === storedOtpStr;
    const isNotExpired = Date.now() <= user.otpExpires;
    
    if (!isOtpValid || !isNotExpired) {
      return res.status(400).json({ 
        message: "Invalid or expired OTP"
      });
    }
    
    
    // Clear OTP after successful verification
    user.otp = null;
    user.otpExpires = null;
    
    // Mark device as trusted if not already
    if (deviceId && !user.trustedDevices.some(d => d.deviceId === deviceId)) {
      user.trustedDevices.push({
        deviceId,
        deviceInfo: deviceInfo || "Unknown",
        trustedAt: new Date()
      });
    }
    
    await user.save();
    
    // Prepare role data
    const roleData = user.role
      ? {
          roleName: user.role.roleName,
          modulePermissions: Object.fromEntries(
            user.role.modulePermissions || []
          ),
        }
      : null;
    
    // Generate JWT token
    let tokenPayload;
    if (isTenant && company) {
      tokenPayload = {
        id: user._id,
        email: user.email,
        companyId: company._id,
        subdomain: company.subdomain,
        dbName: company.dbName,
      };
    } else {
      tokenPayload = {
        id: user._id,
        email: user.email,
      };
    }
    
    const tokenExpiry = rememberMe ? "7d" : "1d";
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: tokenExpiry,
    });
    
    // Set cookie options
    const finalCookieOptions = buildCookieOptions(req, {
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    
    // Set auth cookies
    res.cookie("token", token, finalCookieOptions);
    res.cookie("userId", user._id.toString(), finalCookieOptions);
    
    // ✅ Store tenant info in cookies if tenant
    if (isTenant && company) {
      res.cookie("subdomain", company.subdomain, { ...finalCookieOptions, httpOnly: false });
      res.cookie("dbName", company.dbName, { ...finalCookieOptions, httpOnly: false });
    }
    
    // Set user data cookie (non-HttpOnly for frontend access)
    const userDataCookieOptions = {
      ...finalCookieOptions,
      httpOnly: false,
    };
    
    res.cookie("userData", JSON.stringify({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name || `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      status: user.status,
      role: roleData,
    }), userDataCookieOptions);
    
    // Clear OTP related cookies
    res.clearCookie("otpPending", { path: "/" });
    res.clearCookie("otpEmail", { path: "/" });
    
    // Return success response
    return res.status(200).json({
      message: "OTP verified successfully",
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name || [user.firstName, user.lastName].filter(Boolean).join(" "),
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        status: user.status,
        role: roleData,
      },
      subdomain: company?.subdomain || null,
      dbName: company?.dbName || null,
      redirectPath: isTenant ? "/dashboard" : "/dashboard",
    });
    
  } catch (error) {
    console.error("OTP verification error:", error);
    next(error);
    return res.status(500).json({ 
      message: "Server error during OTP verification",
      error: error.message 
    });
  }
};
exports.resendOtp = async (req, res) => {
  try {
    const { email, subdomain, dbName } = req.body;
    let user;

    if (subdomain && dbName) {
      // Tenant OTP resend
      try {
        const masterConn = await connectMasterDB();
        const Company = CompanyModel(masterConn);
        const company = await Company.findOne({ subdomain, dbName });
        if (!company) {
          return res.status(404).json({ message: "Company not found" });
        }
        const tenantConn = await getTenantDB(dbName);
        const TenantUserModel = User.forTenant(tenantConn);
        user = await TenantUserModel.findOne({ email: email.toLowerCase() });
      } catch (err) {
        console.error("Tenant OTP resend error:", err.message);
        return res.status(500).json({ message: "Could not verify tenant" });
      }
    } else {
      // Master OTP resend
      const masterConn = await connectMasterDB();
      const MasterUserModel = User.forMaster(masterConn);
      user = await MasterUserModel.findOne({ email: email.toLowerCase() });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiry = Date.now() + 5 * 60 * 1000;
    
    // Store as string (matching schema)
    user.otp = String(otp);
    user.otpExpires = expiry;
    await user.save();

    console.log("Resent OTP for:", email, "OTP:", otp);
    await sendEmail(email, "Your Login OTP", `Your OTP code is: ${otp}`);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};
//this is for login device maintain location
exports.logDevice = async (req, res, next) => {
  try {
    const { userId, latitude, longitude } = req.body;
    let ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
      .split(",")[0]
      .trim();
    const userAgent = req.headers["user-agent"];
    let device = "Unknown";
    try {
      const browserName = userAgent.split("/")[0];
      const osMatch = userAgent.match(/\(([^)]+)\)/);
      const os = osMatch ? osMatch[1].split(";")[0].trim() : "Unknown";
      device = `${browserName} ${os.split(" ")[0]}`;
    } catch (error) {
      // console.error("Error parsing user-agent", e.message);
    }
    let location = "Unknown";
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      ip = "127.0.0.1";
      location = "Localhost / Dev";
    } else {
      try {
        const { data } = await axios.get(`https://ipapi.co/${ip}/json/`);
        location = `${data.city}, ${data.region}, ${data.country_name}`;
      } catch (error) {
        // console.log("IP location failed:", error.message);
      }
    }
    // console.log("Creating device log for:", {
    //   userId,
    //   ip,
    //   location,
    //   latitude,
    //   longitude,
    //   device,
    // });

    await DeviceSession.create({
      userId,
      device,
      ipAddress: ip,
      location,
      latitude,
      longitude,
    });
    // console.log("Device log saved successfully");
    res.status(200).json({ message: "Device logged" });
  } catch (error) {
    next(error); // Pass error to global error handler
    // console.error("Log Device Error", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};
// ======================
// GET LOGGED-IN USER (Master + Tenant)
// ======================
exports.getMe = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    const token = req.cookies?.token || bearerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    let user = null;
    let tenantInfo = null;

    if (decoded.dbName) {
      try {
        const masterConn = await connectMasterDB();
        const Company = CompanyModel(masterConn);
        const company = await Company.findOne({
          $or: [
            { dbName: decoded.dbName },
            ...(decoded.subdomain ? [{ subdomain: decoded.subdomain }] : []),
          ],
        }).lean();

        if (!company) {
          return res.status(404).json({
            success: false,
            message: "Company not found",
          });
        }

        if (!company.isActive) {
          return res.status(403).json({
            success: false,
            logout: true,
            message: "Company inactive",
          });
        }

        const tenantConn = await getTenantDB(company.dbName);
        const Employee = User.forTenant(tenantConn);
        const TenantRole = RoleModel.forTenant(tenantConn);

        user = await Employee.findById(decoded.id)
          .populate("role", null, TenantRole)
          .lean();

        tenantInfo = {
          _id: company._id,
          subdomain: company.subdomain,
          dbName: company.dbName,
          isActive: company.isActive,
        };
      } catch (tenantErr) {
        console.error("Tenant lookup failed:", tenantErr.message);
        return res.status(401).json({
          success: false,
          message: "Could not verify tenant user",
        });
      }
    } else if (decoded.adminId || decoded.role === "SUPER_ADMIN") {
      try {
        const masterConn = await connectMasterDB();
        const SuperAdmin = SuperAdminModel(masterConn);
        user = await SuperAdmin.findById(decoded.adminId || decoded.id).lean();
      } catch (adminErr) {
        console.error("Super admin lookup failed:", adminErr.message);
        return res.status(401).json({
          success: false,
          message: "Could not verify admin user",
        });
      }
    } else {
      // Master user lookup
      const masterConn = await connectMasterDB();
      const MasterUserModel = User.forMaster(masterConn);
      const MasterRoleModel = RoleModel.forMaster(masterConn);
      user = await MasterUserModel.findById(decoded.id).populate("role", null, MasterRoleModel).lean();
    }

    if (!user) {
      res.clearCookie("token", buildCookieOptions(req));
      res.clearCookie("userId", buildCookieOptions(req));
      return res.status(401).json({
        success: false,
        logout: true,
        message: "User not found",
      });
    }

    if (user.status && user.status !== "Active") {
      res.clearCookie("token", buildCookieOptions(req));
      res.clearCookie("userId", buildCookieOptions(req));
      return res.status(403).json({
        success: false,
        logout: true,
        message: "Your account is inactive. Please contact admin.",
      });
    }

    let modulePermissions = {};
    if (user.role?.modulePermissions instanceof Map) {
      modulePermissions = Object.fromEntries(user.role.modulePermissions);
    } else if (Array.isArray(user.role?.modulePermissions)) {
      modulePermissions = Object.fromEntries(user.role.modulePermissions);
    } else if (
      user.role?.modulePermissions &&
      typeof user.role.modulePermissions === "object"
    ) {
      modulePermissions = user.role.modulePermissions;
    }

    const roleData = user.role
      ? {
          _id: user.role._id,
          roleName: user.role.roleName,
          modulePermissions,
        }
      : null;

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        name:
          user.name ||
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.username ||
          "",
        username: user.username || "",
        email: user.email,
        phone: user.phone || "",
        profileImage: user.profileImage || null,
        status: user.status || "Active",
        role: roleData,
        tenant: tenantInfo,
      },
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    next(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================
// UNIFIED SAAS LOGIN (Super Admin + Tenant)
// ======================
exports.allLogin = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const { rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const masterConn = await connectMasterDB();
    const Company = CompanyModel(masterConn);
    const SuperAdmin = SuperAdminModel(masterConn);

    // ========================================
    // 1️⃣ SUPER ADMIN LOGIN
    // ========================================
    const admin = await SuperAdmin.findOne({ email });
    if (admin) {
      // Check if admin is inactive
      if (admin.status === "Inactive") {
        return res.status(403).json({
          message: "Your account is inactive. Please contact support.",
          code: "ACCOUNT_INACTIVE",
        });
      }

      const isAdminMatch = await bcrypt.compare(password, admin.password);
      if (!isAdminMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await SuperAdmin.updateOne(
        { _id: admin._id },
        { $set: { lastLogin: new Date() } }
      );

      const tokenPayload = {
        adminId: admin._id,
        email: admin.email,
        role: "SUPER_ADMIN",
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: rememberMe ? "7d" : "1d",
      });

      const finalCookieOptions = buildCookieOptions(req, {
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      });

      res.cookie("token", token, finalCookieOptions);
      res.cookie("userId", admin._id.toString(), finalCookieOptions);

      return res.status(200).json({
        message: "Login successful",
        role: "SUPER_ADMIN",
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone || "",
          status: admin.status,
        },
        redirectPath: "/admin/dashboard",
      });
    }

    // ========================================
    // 2️⃣ TENANT LOGIN
    // ========================================
    // First, look for company by admin/company email
    let companies = await Company.find({
      $or: [{ adminEmail: email }, { companyEmail: email }],
    });

    // Fallback: search all tenant DBs for employee email
    if (!companies.length) {
      companies = await Company.find({}).sort({ createdAt: -1 });
    }

    for (const company of companies) {
      try {
        const tenantConn = await getTenantDB(company.dbName);
        const Employee = User.forTenant(tenantConn);

        const user = await Employee.findOne({ email });
        if (!user) continue;

        // Check if company is active only after user is found in this tenant
        if (!company.isActive) {
          return res.status(403).json({
            message: "Your account is inactive. Please contact your service provider.",
            code: "ACCOUNT_INACTIVE",
          });
        }

        // Check if user is inactive or blocked
        if (isUserAccountBlocked(user.status)) {
          return res.status(403).json({
            message: getBlockedAccountMessage(user.status),
            code: "ACCOUNT_INACTIVE",
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Update last login
        await Employee.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date() } }
        );

        const tokenPayload = {
          id: user._id,
          email: user.email,
          companyId: company._id,
          subdomain: company.subdomain,
          dbName: company.dbName,
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
          expiresIn: rememberMe ? "7d" : "1d",
        });

        const finalCookieOptions = buildCookieOptions(req, {
          maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
        });

        res.cookie("token", token, finalCookieOptions);
        res.cookie("userId", user._id.toString(), finalCookieOptions);

        return res.status(200).json({
          message: "Login successful",
          role: "TENANT",
          token,
          user: {
            id: user._id,
            name: user.name || user.username,
            email: user.email,
            phone: user.phone || "",
            status: user.status,
          },
          subdomain: company.subdomain,
          dbName: company.dbName,
          redirectPath: "/dashboard",
        });
      } catch (tenantErr) {
        console.warn("Tenant login lookup failed for", company.dbName, tenantErr.message);
      }
    }

    return res.status(401).json({ message: "Invalid credentials" });
  } catch (err) {
    console.error("All login error:", err);
    next(err);
  }
};

// ======================
// TENANT LOGIN (by subdomain)
// ======================
exports.loginTenant = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const { subdomain, rememberMe } = req.body;

    if (!email || !password || !subdomain) {
      return res.status(400).json({ message: "Email, password, and subdomain are required" });
    }

    const hostHeader = String(req.headers.host || "").split(":")[0].toLowerCase();
    const currentSubdomain = hostHeader.includes(".") ? hostHeader.split(".")[0] : hostHeader;
    const skipDomains = ["localhost", "127", "www", "admin", "mymunc"];

    if (
      currentSubdomain &&
      !skipDomains.includes(currentSubdomain) &&
      currentSubdomain !== subdomain.toLowerCase()
    ) {
      return res.status(403).json({
        message: "Tenant login must be performed from the tenant's own subdomain.",
      });
    }

    // 1️⃣ Find company in MASTER DB
    const masterConn = await connectMasterDB();
    const Company = CompanyModel(masterConn);

    const company = await Company.findOne({ subdomain });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if company is active
    if (!company.isActive) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact your service provider.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    // 2️⃣ Connect to TENANT DB
    const tenantConn = await getTenantDB(company.dbName);
    const Employee = User.forTenant(tenantConn);

    // 3️⃣ Find employee
    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is inactive or blocked
    if (isUserAccountBlocked(user.status)) {
      return res.status(403).json({
        message: getBlockedAccountMessage(user.status),
        code: "ACCOUNT_INACTIVE",
      });
    }

    // 4️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    await Employee.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // 5️⃣ Create token
    const tokenPayload = {
      id: user._id,
      email: user.email,
      companyId: company._id,
      subdomain: company.subdomain,
      dbName: company.dbName,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: rememberMe ? "7d" : "1d",
    });

    const finalCookieOptions = buildCookieOptions(req, {
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.cookie("token", token, finalCookieOptions);
    res.cookie("userId", user._id.toString(), finalCookieOptions);

    return res.status(200).json({
      message: "Login successful",
      role: "TENANT",
      token,
      user: {
        id: user._id,
        name: user.name || user.username,
        email: user.email,
        phone: user.phone || "",
        status: user.status,
      },
      subdomain: company.subdomain,
      dbName: company.dbName,
      redirectPath: "/dashboard",
    });
  } catch (err) {
    console.error("Tenant login error:", err);
    next(err);
  }
};
