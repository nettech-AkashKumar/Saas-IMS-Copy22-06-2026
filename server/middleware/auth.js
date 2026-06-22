const jwt = require("jsonwebtoken");
const connectMasterDB = require("../config/SaaS/masterDb");
const getTenantDB = require("../config/SaaS/tenantDb");
const CompanyModel = require("../models/SaaS/master/Company.model");
const SuperAdminModel = require("../models/SaaS/master/SuperAdmin");
const User = require("../models/usersModels");
const RoleModel = require("../models/roleModels");

const authMiddleware = async (req, res, next) => {
  try {
    // ============================
    // ✅ 1. TOKEN GET
    // ============================
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    // ============================
    // ✅ 2. VERIFY TOKEN
    // ============================
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // ============================
    // ✅ 3. SUPER ADMIN FLOW - Verify in Master DB
    // ============================
    if (decoded.adminId || decoded.role === "SUPER_ADMIN") {
      try {
        const masterConn = await connectMasterDB();
        const SuperAdmin = SuperAdminModel(masterConn);

        const superAdmin = await SuperAdmin.findById(decoded.adminId || decoded.id);

        if (!superAdmin) {
          return res.status(401).json({
            success: false,
            message: "Super Admin not found",
          });
        }

        req.user = {
          _id: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "SUPER_ADMIN",
          tenant: null,
          userType: "SUPER_ADMIN", // ✅ Set user type
        };
        req.db = masterConn; // ✅ Set master DB connection
        return next();
      } catch (dbError) {
        console.error("Auth error (Super Admin DB lookup):", dbError.message);
        return res.status(503).json({
          success: false,
          message: "Database connection error",
        });
      }
    }

    // ============================
    // ✅ 4. MASTER USER FLOW - Use connection-scoped model
    // ============================
    if (!decoded.dbName) {
      try {
        const masterConn = await connectMasterDB();
        const MasterUserModel = User.forMaster(masterConn);
        const MasterRoleModel = RoleModel.forMaster(masterConn);

        const user = await MasterUserModel.findById(decoded.id)
          .select("_id firstName lastName name email phone profileImage status role")
          .populate("role", "roleName modulePermissions", MasterRoleModel);

        if (!user) {
          return res.status(401).json({
            success: false,
            message: "User not found",
          });
        }

        const userObject = user.toObject();
        if (userObject.role?.modulePermissions instanceof Map) {
          userObject.role.modulePermissions = Object.fromEntries(
            userObject.role.modulePermissions
          );
        }

        req.user = userObject;
        req.db = masterConn; // ✅ Set master DB connection
        req.user.userType = "MASTER_USER"; // ✅ Set user type for permission checks
        return next();
      } catch (dbError) {
        console.error("Auth error (Master User DB lookup):", dbError.message);
        return res.status(503).json({
          success: false,
          message: "Database connection error",
        });
      }
    }

    // ============================
    // ✅ 5. TENANT RESOLVE FROM TOKEN
    // ============================
    try {
      const masterDB = await connectMasterDB();
      const Tenant = CompanyModel(masterDB);

      const tenant = await Tenant.findOne({
        $or: [
          { dbName: decoded.dbName },
          ...(decoded.subdomain ? [{ subdomain: decoded.subdomain }] : []),
        ],
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }

      if (!tenant.isActive) {
        return res.status(403).json({
          success: false,
          message: "Company inactive",
        });
      }

      // ============================
      // ✅ 6. TENANT DB CONNECT
      // ============================
      const tenantDB = await getTenantDB(tenant.dbName);

      // ============================
      // ✅ 7. FETCH USER FROM TENANT DB
      // ============================
      const Employee = User.forTenant(tenantDB);
      const TenantRole = RoleModel.forTenant(tenantDB);

      const user = await Employee.findById(decoded.id)
        .select("_id firstName lastName name email phone profileImage status role")
        .populate("role", "roleName modulePermissions", TenantRole);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      const userObject = user.toObject();
      if (userObject.role?.modulePermissions instanceof Map) {
        userObject.role.modulePermissions = Object.fromEntries(
          userObject.role.modulePermissions
        );
      }

      // ============================
      // ✅ 8. FINAL ATTACH (USER + TENANT)
      // ============================
      req.user = {
        ...userObject,
        tenant: {
          _id: tenant._id,
          subdomain: tenant.subdomain,
          dbName: tenant.dbName,
          isActive: tenant.isActive,
        },
        userType: "TENANT_USER", // ✅ Set user type
      };

      req.db = tenantDB; // ✅ Set tenant DB connection

      next();
    } catch (dbError) {
      console.error("Auth error (Tenant DB lookup):", dbError.message);
      return res.status(503).json({
        success: false,
        message: "Database connection error",
      });
    }
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Server error in auth middleware",
    });
  }
};

module.exports = { authMiddleware };


// const jwt = require("jsonwebtoken");
// const User = require("../models/usersModels");

// exports.authMiddleware = async (req, res, next) => {
//   try {
//     // const token = req.header("Authorization")?.split(" ")[1];
//     const token = req.cookies.token;

//     if (!token) {
//       return res
//         .status(401)
//         .json({ message: "No token, authorization denied" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.id).select(
//       "_id firstName lastName email role",
//     )
//     .populate("role", "roleName");
//     if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({ message: "Token expired" });
//     }
//     return res.status(401).json({ message: "Invalid token" });
//   }
// };




