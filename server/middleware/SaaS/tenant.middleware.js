const getTenantDB = require("../../config/SaaS/tenantDb");

const tenantMiddleware = async (req, res, next) => {
  try {
    const dbName =
      req.user?.dbName ||
      req.headers["x-tenant-db"]; // ✅ FIXED

    console.log("TENANT DB NAME 👉", dbName);

    if (!dbName) {
      return res.status(400).json({
        success: false,
        message: "Tenant DB name missing",
      });
    }

    req.db = await getTenantDB(dbName);

    next();
  } catch (err) {
    console.log("TENANT MIDDLEWARE ERROR 👉", err.message);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = tenantMiddleware;