/**
 * Permission check middleware - supports Master/Tenant context
 * - Master users: Role string "SUPER_ADMIN" or "Admin" gets full access
 * - Tenant users: Check modulePermissions from role object
 */
exports.checkPermission = (module, action) => {
  return (req, res, next) => {
    try {
      const userType = req.user?.userType;
      const role = req.user?.role;

      // ✅ SUPER_ADMIN and MASTER_USER get full access
      if (userType === "SUPER_ADMIN" || userType === "MASTER_USER") {
        // console.log(`Allowed → ${userType} has full access to ${module} ${action}`);
        return next();
      }

      // ✅ For TENANT_USER, check modulePermissions
      if (!role || !role.modulePermissions) {
        return res.status(403).json({ message: "Access denied: No role permissions found" });
      }

      // Normalize module name
      const moduleKey = Object.keys(role.modulePermissions).find(
        (key) => key.toLowerCase() === module.toLowerCase()
      );

      if (!moduleKey) {
        return res.status(403).json({ message: `Access denied: No permission for '${module}'` });
      }

      const perms = role.modulePermissions[moduleKey];

      // Handle both object and Map
      const getPerm = (obj, key) => {
        if (!obj) return false;
        if (typeof obj.get === "function") return obj.get(key);
        return obj[key];
      };

      const actionKey = action.toLowerCase() === "write" ? "create" : action.toLowerCase();
      const hasAll = getPerm(perms, "all");
      const hasAction = getPerm(perms, actionKey);

      if (!hasAll && !hasAction) {
        return res.status(403).json({
          message: `Access denied: '${action}' not allowed for '${module}'`,
        });
      }

      // console.log(`Allowed → ${moduleKey} ${action}`);
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ message: "Permission middleware error" });
    }
  };
};
// exports.checkPermission = (module, action) => {
//   return (req, res, next) => {
//     try {
//       const user = req.user;
//       const role = user?.role;

//       // Reject if no user
//       if (!user) {
//         return res.status(403).json({ message: "Access denied: No user found" });
//       }

//       // ✅ Check if user is SUPER_ADMIN or MASTER_USER (bypass all permissions)
//       if (user.userType === "SUPER_ADMIN" || user.userType === "MASTER_USER") {
//         console.log(`✅ Master User Bypass → ${module} ${action} (userType: ${user.userType})`);
//         return next();
//       }

//       // ✅ Check if role is string "SUPER_ADMIN" (from auth middleware)
//       if (typeof role === "string" && (role === "SUPER_ADMIN" || role === "Admin" || role === "SuperAdmin")) {
//         console.log(`✅ Master Admin Bypass → ${module} ${action}`);
//         return next();
//       }

//       // ✅ Role must be an object for tenant users
//       if (!role || typeof role !== "object") {
//         return res.status(403).json({ message: "Access denied: Invalid role format" });
//       }

//       // Check modulePermissions exists
//       if (!role.modulePermissions) {
//         return res.status(403).json({ message: "Access denied: No role permissions found" });
//       }

//       // Verify tenant context exists for non-master users
//       if (!req.db) {
//         return res.status(403).json({ message: "Access denied: No tenant context (req.db) found" });
//       }

//       // Normalize module name - handle both Map and Object
//       let moduleKey;
//       if (role.modulePermissions instanceof Map) {
//         moduleKey = Array.from(role.modulePermissions.keys()).find(
//           (key) => key.toLowerCase() === module.toLowerCase()
//         );
//       } else {
//         moduleKey = Object.keys(role.modulePermissions).find(
//           (key) => key.toLowerCase() === module.toLowerCase()
//         );
//       }

//       if (!moduleKey) {
//         return res.status(403).json({ message: `Access denied: No permission for '${module}'` });
//       }

//       const perms = role.modulePermissions[moduleKey] || role.modulePermissions.get?.(moduleKey);

//       if (!perms) {
//         return res.status(403).json({ message: `Access denied: Permission not found for '${module}'` });
//       }

//       // Handle both object and Map
//       const getPerm = (obj, key) => {
//         if (!obj) return false;
//         if (typeof obj.get === "function") return obj.get(key);
//         return obj[key];
//       };

//       const hasAll = getPerm(perms, "all");
//       const hasAction = getPerm(perms, action.toLowerCase());

//       if (!hasAll && !hasAction) {
//         return res.status(403).json({
//           message: `Access denied: '${action}' not allowed for '${module}'`,
//         });
//       }

//       console.log(`✅ Tenant User Allowed → ${moduleKey} ${action}`);
//       next();
//     } catch (error) {
//       console.error("Permission check error:", error);
//       return res.status(500).json({ message: "Permission middleware error: " + error.message });
//     }
//   };
// };