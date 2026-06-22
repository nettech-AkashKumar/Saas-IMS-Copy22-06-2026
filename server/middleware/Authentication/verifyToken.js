

const jwt = require("jsonwebtoken");
const User = require("../../models/usersModels");
const RoleModel = require("../../models/roleModels");
const SuperAdminModel = require("../../models/SaaS/master/SuperAdmin");
const CompanyModel = require("../../models/SaaS/master/Company.model");
const connectMasterDB = require("../../config/SaaS/masterDb");
const getTenantDB = require("../../config/SaaS/tenantDb");

exports.verifyToken = async (req, res, next) => {
  try {
    // 🔥 1. Read token from cookie OR Authorization header
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // 🔐 2. Verify token signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ 
          message: "Token expired",
          logout: true 
        });
      }
      return res.status(401).json({ 
        message: "Invalid or expired token" 
      });
    }

    let user;

    // ============================
    // ✅ SUPER ADMIN FLOW - Check in Master DB
    // ============================
    if (decoded.adminId || decoded.role === "SUPER_ADMIN") {
      try {
        const masterDB = await connectMasterDB();
        
        if (!masterDB) {
          throw new Error("Master DB connection failed");
        }

        const SuperAdmin = SuperAdminModel(masterDB);
        
        user = await SuperAdmin.findById(decoded.adminId || decoded.id)
          .select("_id name email role status")
          .lean();

        if (!user) {
          return res.status(401).json({ 
            message: "Super Admin not found",
            logout: true 
          });
        }

        req.user = {
          ...user,
          role: "SUPER_ADMIN",
          dbName: null,
          userType: "SUPER_ADMIN"
        };
        return next();
      } catch (dbError) {
        console.error("❌ Super Admin verification error:", dbError.message);
        return res.status(503).json({ 
          message: "Database connection error",
          error: dbError.message 
        });
      }
    }

    // ============================
    // ✅ MASTER USER FLOW - Check in Master DB (no dbName in token)
    // ============================
    if (!decoded.dbName) {
      try {
        const masterDB = await connectMasterDB();
        
        if (!masterDB) {
          throw new Error("Master DB connection failed");
        }

        // ✅ CRITICAL: Use connection-scoped models
        const MasterUserModel = User.forMaster(masterDB);
        const MasterRoleModel = RoleModel.forMaster(masterDB);

        if (!MasterUserModel) {
          throw new Error("Failed to initialize Master User model");
        }

        user = await MasterUserModel.findById(decoded.id)
          .select("_id firstName lastName name email phone profileImage status role")
          .populate("role", "roleName modulePermissions", MasterRoleModel)
          .lean({ virtuals: true });

        if (!user) {
          return res.status(401).json({ 
            message: "User not found",
            logout: true 
          });
        }

        // 🚫 Block inactive users
        if (user.status !== "Active") {
          return res.status(401).json({
            message: "You are currently set Inactive by admin or superadmin. Please contact admin.",
            logout: true,
          });
        }

        // 🧠 Convert Map → Object (IMPORTANT)
        if (user.role?.modulePermissions instanceof Map) {
          user.role.modulePermissions = Object.fromEntries(
            user.role.modulePermissions
          );
        }

        req.user = {
          ...user,
          dbName: null,
          userType: "MASTER_USER"
        };
        return next();
      } catch (dbError) {
        console.error("❌ Master user verification error:", dbError.message);
        return res.status(503).json({ 
          message: "Database connection error",
          error: dbError.message 
        });
      }
    }

    // ============================
    // ✅ TENANT USER FLOW - Check in Tenant DB (has dbName in token)
    // ============================
    try {
      if (!decoded.dbName) {
        throw new Error("dbName is required for tenant flow");
      }

      // First, resolve tenant from master DB
      const masterDB = await connectMasterDB();
      
      if (!masterDB) {
        throw new Error("Master DB connection failed");
      }

      const TenantModelMaster = CompanyModel(masterDB);

      const tenant = await TenantModelMaster.findOne({
        $or: [
          { dbName: decoded.dbName },
          ...(decoded.subdomain ? [{ subdomain: decoded.subdomain }] : []),
        ],
      }).lean();

      if (!tenant) {
        return res.status(404).json({ 
          message: "Company not found",
          logout: true 
        });
      }

      if (!tenant.isActive) {
        return res.status(403).json({ 
          message: "Company is inactive",
          logout: true 
        });
      }

      // ✅ Now connect to TENANT DB (NOT master)
      const tenantDB = await getTenantDB(tenant.dbName);

      if (!tenantDB) {
        throw new Error(`Tenant DB connection failed for ${tenant.dbName}`);
      }

      // ✅ CRITICAL: Use connection-scoped models for TENANT DB
      const TenantUserModel = User.forTenant(tenantDB);
      const TenantRoleModel = RoleModel.forTenant(tenantDB);

      if (!TenantUserModel) {
        throw new Error("Failed to initialize Tenant User model");
      }

      user = await TenantUserModel.findById(decoded.id)
        .select("_id firstName lastName name email phone profileImage status role")
        .populate("role", "roleName modulePermissions", TenantRoleModel)
        .lean({ virtuals: true });

      if (!user) {
        return res.status(401).json({ 
          message: "User not found in company",
          logout: true 
        });
      }

      // 🚫 Block inactive users
      if (user.status !== "Active") {
        return res.status(401).json({
          message: "You are currently set Inactive by admin or superadmin. Please contact admin.",
          logout: true,
        });
      }

      // 🧠 Convert Map → Object (IMPORTANT)
      if (user.role?.modulePermissions instanceof Map) {
        user.role.modulePermissions = Object.fromEntries(
          user.role.modulePermissions
        );
      }

      req.user = {
        ...user,
        tenant: {
          _id: tenant._id,
          dbName: tenant.dbName,
          subdomain: tenant.subdomain,
          isActive: tenant.isActive,
        },
        userType: "TENANT_USER"
      };
      return next();
    } catch (dbError) {
      console.error("❌ Tenant user verification error:", dbError.message);
      return res.status(503).json({ 
        message: "Database connection error",
        error: dbError.message 
      });
    }
  } catch (error) {
    console.error("❌ Token verification error:", error.message);
    return res.status(401).json({ 
      message: "Invalid or expired token" 
    });
  }
};
