/**
 * Tenant + User Validation Hook
 * Provides comprehensive validation for tenant-scoped operations
 * Ensures proper authorization and data isolation
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../components/auth/AuthContext';
import { toast } from 'react-toastify';

/**
 * Validation result structure
 */
const createValidationResult = (isValid, message = '', data = null) => ({
  isValid,
  message,
  data,
  timestamp: Date.now()
});

/**
 * Tenant + User Validation Hook
 * @param {Object} options - Validation options
 * @param {boolean} options.requireSuperAdmin - Require super admin role
 * @param {boolean} options.requireTenant - Require tenant context
 * @param {boolean} options.checkPermissions - Check specific permissions
 * @param {Array} options.allowedRoles - Array of allowed roles
 */
export const useTenantUserValidation = (options = {}) => {
  const {
    requireSuperAdmin = false,
    requireTenant = false,
    checkPermissions = false,
    allowedRoles = []
  } = options;

  const { user, loading: authLoading } = useAuth();
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(true);

  // Validate user authentication and roles
  const validateUser = useCallback(() => {
    if (authLoading) {
      return createValidationResult(false, 'Authentication in progress...');
    }

    if (!user) {
      return createValidationResult(false, 'Authentication required. Please log in.');
    }

    // Check super admin requirement
    if (requireSuperAdmin && user.role !== 'SUPER_ADMIN') {
      return createValidationResult(false, 'Super Admin access required for this operation.');
    }

    // Check allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return createValidationResult(false, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    // Check tenant requirement
    if (requireTenant && !user.tenant && user.role !== 'SUPER_ADMIN') {
      return createValidationResult(false, 'Tenant context required for this operation.');
    }

    return createValidationResult(true, 'Validation successful', {
      userId: user._id,
      userRole: user.role,
      tenantId: user.tenant,
      isSuperAdmin: user.role === 'SUPER_ADMIN',
      permissions: user.permissions || []
    });
  }, [user, authLoading, requireSuperAdmin, requireTenant, allowedRoles]);

  // Validate tenant context
  const validateTenantContext = useCallback((tenantId = null) => {
    const userValidation = validateUser();
    if (!userValidation.isValid) {
      return userValidation;
    }

    // Super admin can access all tenants
    if (userValidation.data.isSuperAdmin) {
      return createValidationResult(true, 'Super Admin access granted', userValidation.data);
    }

    // Check tenant ownership
    if (tenantId && userValidation.data.tenantId !== tenantId) {
      return createValidationResult(false, 'Access denied: Tenant mismatch');
    }

    return createValidationResult(true, 'Tenant validation successful', {
      ...userValidation.data,
      validatedTenantId: tenantId || userValidation.data.tenantId
    });
  }, [validateUser]);

  // Validate operation permissions
  const validatePermissions = useCallback((requiredPermissions = []) => {
    const userValidation = validateUser();
    if (!userValidation.isValid) {
      return userValidation;
    }

    if (!checkPermissions || requiredPermissions.length === 0) {
      return userValidation;
    }

    const userPermissions = userValidation.data.permissions || [];
    const hasAllPermissions = requiredPermissions.every(perm =>
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return createValidationResult(false,
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
      );
    }

    return createValidationResult(true, 'Permission validation successful', userValidation.data);
  }, [validateUser, checkPermissions]);

  // Validate input data
  const validateInput = useCallback((data, rules = {}) => {
    const errors = [];

    // Required fields validation
    if (rules.required) {
      rules.required.forEach(field => {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
          errors.push(`${field} is required`);
        }
      });
    }

    // Email validation
    if (rules.email && data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Invalid email format');
      }
    }

    // Phone validation
    if (rules.phone && data.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push('Invalid phone number format');
      }
    }

    // ID validation
    if (rules.objectId && data.id) {
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(data.id)) {
        errors.push('Invalid ID format');
      }
    }

    // Custom validation rules
    if (rules.custom) {
      Object.entries(rules.custom).forEach(([field, validator]) => {
        if (typeof validator === 'function') {
          const result = validator(data[field], data);
          if (result !== true) {
            errors.push(result || `${field} validation failed`);
          }
        }
      });
    }

    if (errors.length > 0) {
      return createValidationResult(false, errors.join('; '));
    }

    return createValidationResult(true, 'Input validation successful', data);
  }, []);

  // Comprehensive validation for operations
  const validateOperation = useCallback((operation, data = {}) => {
    // Step 1: User authentication and role validation
    const userValidation = validateUser();
    if (!userValidation.isValid) {
      return userValidation;
    }

    // Step 2: Tenant context validation
    const tenantValidation = validateTenantContext(data.tenantId);
    if (!tenantValidation.isValid) {
      return tenantValidation;
    }

    // Step 3: Permission validation
    const permissionValidation = validatePermissions(data.requiredPermissions);
    if (!permissionValidation.isValid) {
      return permissionValidation;
    }

    // Step 4: Input validation
    if (data.inputRules) {
      const inputValidation = validateInput(data.inputData || {}, data.inputRules);
      if (!inputValidation.isValid) {
        return inputValidation;
      }
    }

    return createValidationResult(true, `${operation} validation successful`, {
      user: userValidation.data,
      tenant: tenantValidation.data,
      permissions: permissionValidation.data,
      operation,
      timestamp: Date.now()
    });
  }, [validateUser, validateTenantContext, validatePermissions, validateInput]);

  // Update validation result
  useEffect(() => {
    const result = validateUser();
    setValidationResult(result);
    setIsValidating(false);
  }, [validateUser]);

  return {
    // Validation state
    isValidating,
    isValid: validationResult?.isValid || false,
    validationMessage: validationResult?.message || '',
    validationData: validationResult?.data || null,

    // Validation methods
    validateUser,
    validateTenantContext,
    validatePermissions,
    validateInput,
    validateOperation,

    // User data
    user,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    userRole: user?.role,
    tenantId: user?.tenant,

    // Utility methods
    showValidationError: (message) => {
      toast.error(message || validationResult?.message || 'Validation failed');
    },

    showValidationSuccess: (message) => {
      toast.success(message || 'Validation successful');
    }
  };
};

/**
 * Pre-configured validation hooks for common use cases
 */

// Super Admin only validation
export const useSuperAdminValidation = () => {
  return useTenantUserValidation({
    requireSuperAdmin: true,
    allowedRoles: ['SUPER_ADMIN']
  });
};

// Tenant user validation
export const useTenantValidation = () => {
  return useTenantUserValidation({
    requireTenant: true,
    allowedRoles: ['TENANT_ADMIN', 'TENANT_USER']
  });
};

// Admin validation (super admin or tenant admin)
export const useAdminValidation = () => {
  return useTenantUserValidation({
    allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN']
  });
};

export default useTenantUserValidation;