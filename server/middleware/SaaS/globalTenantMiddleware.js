// middleware/SaaS/globalTenantMiddleware.js

const tenantResolver = require("./tenantResolver");

// Public routes that DON'T need tenant
const PUBLIC_PATHS = [
  "/api/public",
  "/api/auth",
  "/api/otp",
  "/health",
];

module.exports = async (req, res, next) => {
  try {
    const path = req.path;

    // ✅ skip public routes
    const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

    if (isPublic) {
      return next();
    }

    // ✅ run tenant resolver automatically
    await tenantResolver(req, res, next);

  } catch (err) {
    next(err);
  }
};