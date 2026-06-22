/**
 * Tenant Isolation Validation Middleware
 * CRITICAL SECURITY: Ensures authenticated users can only access their own tenant's data
 * Prevents cross-tenant data leakage and unauthorized access
 */

const { logger } = require("../../utils/logger");
const connectMasterDB = require("../../config/SaaS/masterDb");
const getTenantDB = require("../../config/SaaS/tenantDb");
const CompanyModel = require("../../models/SaaS/master/Company.model");

const tenantIsolationValidation = async (req, res, next) => {
  try {
    // Skip validation for public routes
    const publicPaths = [
      "/api/public",
      "/api/auth",
      "/api/otp",
      "/api/forgot",
      "/health"
    ];

    const isPublicRoute = publicPaths.some(path => req.path.startsWith(path));
    if (isPublicRoute) {
      return next();
    }

    // Skip validation for super admin routes (they can access all tenants)
    const superAdminPaths = [
      "/api/super",
      "/api/hero",
      "/api/pricing"
    ];

    const rawPath = req.originalUrl || req.path || req.baseUrl || req.url || "";
    const requestPath = rawPath.split("?")[0];
    const isSuperAdminRoute = superAdminPaths.some((path) =>
      requestPath.startsWith(path)
    );

    if (isSuperAdminRoute) {
      logger.info("Tenant Isolation: Skipping validation for super admin route", {
        requestPath,
        rawPath,
        path: req.path,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
        url: req.url,
        method: req.method
      });
      return next();
    }

    // If auth has not yet run, do not block here.
    // Route-level authMiddleware should handle token validation and missing credentials.
    if (!req.user && !req.admin) {
      logger.debug("Tenant Isolation: No authenticated user yet; deferring auth to route handler", {
        path: req.path,
        requestPath,
        rawPath,
        originalUrl: req.originalUrl,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        isSuperAdminRoute,
        hasUser: !!req.user,
        hasAdmin: !!req.admin,
        authorizationHeader: req.headers.authorization || "none"
      });
      return next();
    }

    // Super admin can access all tenants (either via req.user or req.admin)
    const adminRole = req.user?.role || req.user?.userType || req.admin?.role;
    const adminId = req.user?._id || req.user?.id || req.admin?._id || req.admin?.id || req.userId;
    
    if (adminRole === "SUPER_ADMIN" || req.admin?.role === "SUPER_ADMIN") {
      // Check if super-admin wants to access a specific tenant
      const tenantId = req.get('x-tenant-id');
      if (tenantId) {
        try {
          const masterConn = await connectMasterDB();
          const Company = CompanyModel(masterConn);
          const tenant = await Company.findById(tenantId);
          if (tenant && tenant.isActive) {
            const tenantDB = await getTenantDB(tenant.dbName);
            req.db = tenantDB;
            req.tenant = tenant;
            logger.info("Tenant Isolation: Super admin accessing specific tenant", {
              userId: adminId,
              tenantId: tenant._id,
              tenantSubdomain: tenant.subdomain,
              path: req.path
            });
          } else {
            logger.warn("Tenant Isolation: Super admin requested invalid tenant", {
              userId: adminId,
              requestedTenantId: tenantId,
              path: req.path
            });
            return res.status(404).json({
              success: false,
              message: "Tenant not found or inactive"
            });
          }
        } catch (error) {
          logger.error("Tenant Isolation: Error resolving tenant for super-admin", {
            error: error.message,
            userId: adminId,
            requestedTenantId: tenantId,
            path: req.path
          });
          return res.status(500).json({
            success: false,
            message: "Error accessing tenant"
          });
        }
      }
      
      logger.info("Tenant Isolation: Super admin access granted", {
        userId: adminId,
        role: adminRole,
        tenantId: req.tenant?._id,
        path: req.path
      });
      return next();
    }

    // For tenant users, ensure tenant context exists
    if (req.user?.userType === "TENANT_USER") {
      if (!req.tenant) {
        logger.error("Tenant Isolation: No tenant context found for tenant user", {
          userId: req.user._id,
          userType: req.user.userType,
          userTenant: req.user.tenant,
          path: req.path
        });
        return res.status(403).json({
          success: false,
          message: "Tenant context required"
        });
      }

      // Additional check: ensure tenant is active for tenant users
      if (!req.tenant.isActive) {
        logger.warn("Tenant Isolation: Inactive tenant access attempt by tenant user", {
          userId: req.user._id,
          tenantId: req.tenant._id,
          subdomain: req.tenant.subdomain,
          path: req.path
        });
        return res.status(403).json({
          success: false,
          message: "Tenant is inactive"
        });
      }
    }

    // CRITICAL VALIDATION: For tenant users, ensure they belong to the resolved tenant
    if (req.user?.userType === "TENANT_USER") {
      const userTenantId = req.user.tenant?._id || req.user.tenant;
      const resolvedTenantId = req.tenant._id;

      if (!userTenantId) {
        logger.error("Tenant Isolation: User has no tenant association", {
          userId: req.user._id,
          userType: req.user.userType,
          resolvedTenant: resolvedTenantId,
          path: req.path
        });
        return res.status(403).json({
          success: false,
          message: "User not associated with any tenant"
        });
      }

      // Convert to string for comparison (handles ObjectId vs string)
      const userTenantStr = userTenantId.toString();
      const resolvedTenantStr = resolvedTenantId.toString();

      if (userTenantStr !== resolvedTenantStr) {
        logger.error("TENANT ISOLATION BREACH DETECTED!", {
          userId: req.user._id,
          userEmail: req.user.email,
          userTenant: userTenantStr,
          resolvedTenant: resolvedTenantStr,
          subdomain: req.tenant.subdomain,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          success: false,
          message: "Access denied: Tenant isolation violation"
        });
      }
    }

    // Log successful validation
    logger.info("Tenant Isolation: Access validated", {
      userId: req.user?._id || req.admin?._id,
      tenantId: req.tenant?._id,
      subdomain: req.tenant?.subdomain,
      isAdmin: !!req.admin,
      path: req.path
    });

    // All validations passed
    next();

  } catch (error) {
    logger.error("Tenant Isolation Validation Error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      path: req.path,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error during tenant validation"
    });
  }
};

module.exports = tenantIsolationValidation;