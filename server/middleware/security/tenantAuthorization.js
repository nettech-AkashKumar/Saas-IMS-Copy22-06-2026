/**
 * Tenant-User Authorization Middleware
 * Ensures users can only access their own tenant's data
 * Validates tenant ownership and enforces data isolation
 * 
 * NOTE: This is a route-level middleware that works with global tenantIsolationValidation
 * Use this when you need additional tenant-scoped authorization checks
 */

const {logger} = require("../../utils/logger");

/**
 * Middleware to enforce tenant-user authorization
 * Verifies that authenticated user belongs to the requested tenant
 * 
 * Works with global tenantIsolationValidation middleware
 * - Global middleware handles: authentication, public/super-admin routes
 * - This middleware handles: per-route tenant authorization
 */
const tenantUserAuthorization = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by global auth middleware)
    const user = req.user || req.admin;
    
    if (!user) {
      logger.warn('Tenant Authorization: No authenticated user', {
        path: req.path,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Super admin can access all tenants
    if (user.role === 'SUPER_ADMIN' || user.userType === 'SUPER_ADMIN') {
      req.isSuperAdmin = true;
      logger.debug('Tenant Authorization: Super admin access', {
        userId: user._id,
        path: req.path
      });
      return next();
    }

    // Extract tenant ID from various sources
    const tenantFromParam = req.params.tenantId || req.query.tenantId;
    const tenantFromBody = req.body?.tenantId;
    const tenantFromHeader = req.get('x-tenant-id');
    const tenantFromUser = user.tenant;

    const requestedTenant = tenantFromParam || tenantFromBody || tenantFromHeader;

    // For tenant-scoped requests, verify user belongs to tenant
    if (requestedTenant) {
      // User's tenant must match requested tenant
      if (tenantFromUser && tenantFromUser.toString() !== requestedTenant.toString()) {
        logger.warn('Tenant Authorization: Unauthorized tenant access attempt', {
          userId: user._id,
          userTenant: tenantFromUser,
          requestedTenant,
          path: req.path,
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied: You cannot access this tenant'
        });
      }
    }

    // Store tenant context for downstream use (for resource-level checks)
    req.tenantContext = {
      tenantId: tenantFromUser,
      userId: user._id,
      userRole: user.role || user.userType,
      isSuperAdmin: user.role === 'SUPER_ADMIN' || user.userType === 'SUPER_ADMIN'
    };

    next();
  } catch (error) {
    logger.error('Tenant Authorization: Error', { 
      error: error.message,
      path: req.path,
      ip: req.ip
    });
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

/**
 * Middleware to verify tenant ownership of resource
 * Use this after loading a resource to ensure user owns it
 * 
 * @param {String} resourceTenantField - Field name in resource that contains tenant ID (default: 'tenantId')
 * @param {String} resourceIdField - Field name for resource ID in logs (default: '_id')
 */
const verifyTenantOwnership = (resourceTenantField = 'tenantId', resourceIdField = '_id') => {
  return (req, res, next) => {
    try {
      const user = req.user || req.admin;

      // Super admin can access any resource
      if (user?.role === 'SUPER_ADMIN' || user?.userType === 'SUPER_ADMIN') {
        logger.debug('Tenant Ownership: Super admin access allowed', {
          resourceId: req.resource?.[resourceIdField],
          path: req.path
        });
        return next();
      }

      // Get resource tenant ID
      const resourceTenant = req.resource?.[resourceTenantField];
      const userTenant = user?.tenant;

      if (!resourceTenant) {
        logger.error('Tenant Ownership: Resource missing tenant field', {
          resourceId: req.resource?.[resourceIdField],
          field: resourceTenantField,
          path: req.path
        });
        return res.status(500).json({
          success: false,
          message: 'Unable to verify resource ownership: Invalid resource'
        });
      }

      if (!userTenant) {
        logger.error('Tenant Ownership: User missing tenant association', {
          userId: user?._id,
          path: req.path
        });
        return res.status(403).json({
          success: false,
          message: 'Unable to verify resource ownership: User not associated with tenant'
        });
      }

      // Verify ownership
      if (resourceTenant.toString() !== userTenant.toString()) {
        logger.warn('Tenant Ownership: Unauthorized resource access attempt', {
          userId: user._id,
          userTenant: userTenant.toString(),
          resourceTenant: resourceTenant.toString(),
          resourceId: req.resource[resourceIdField],
          path: req.path,
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied: Cannot access this resource'
        });
      }

      logger.debug('Tenant Ownership: Access verified', {
        userId: user._id,
        tenantId: userTenant.toString(),
        resourceId: req.resource[resourceIdField]
      });

      next();
    } catch (error) {
      logger.error('Tenant Ownership: Verification error', { 
        error: error.message,
        path: req.path,
        ip: req.ip
      });
      return res.status(500).json({
        success: false,
        message: 'Resource verification failed'
      });
    }
  };
};

module.exports = {
  tenantUserAuthorization,
  verifyTenantOwnership
};

/**
 * USAGE GUIDE
 * 
 * 1. GLOBAL TENANT ISOLATION (Applied in server/index.js):
 *    - Validates all requests for authentication
 *    - Skips public routes automatically
 *    - Allows super-admin bypass for /api/super, /api/hero, /api/pricing
 *    
 * 2. ROUTE-LEVEL TENANT AUTHORIZATION (Use in routes):
 *    
 *    // Example 1: Simple tenant authorization
 *    router.get('/tenant/:tenantId/data', 
 *      tenantUserAuthorization,  // Verify user can access requested tenant
 *      controller.getData
 *    );
 *    
 *    // Example 2: Resource ownership verification
 *    router.get('/resource/:id',
 *      tenantUserAuthorization,
 *      async (req, res, next) => {
 *        const resource = await Model.findById(req.params.id);
 *        req.resource = resource;
 *        next();
 *      },
 *      verifyTenantOwnership('tenantId', '_id'),  // Custom field names if needed
 *      controller.getResource
 *    );
 * 
 * FLOW:
 * Request → Global Middleware:
 *   ├── hostValidation
 *   ├── securityHeaders
 *   ├── inputValidation
 *   ├── parameterPollutionCheck
 *   ├── corsSecurityCheck
 *   ├── tenantIsolationValidation (auth check + tenant check)
 *   └── Route Handler
 *       ├── tenantUserAuthorization (if needed for route-level checks)
 *       ├── Resource loading
 *       ├── verifyTenantOwnership (if needed for resource ownership)
 *       └── Controller
 */
