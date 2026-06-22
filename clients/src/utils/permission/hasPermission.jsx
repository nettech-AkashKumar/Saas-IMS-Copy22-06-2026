// utils/permission/hasPermission.jsx
export const hasPermission = (user, module, action) => {
  if (!user) return false;
  try {
    const modulePermissions = user?.role?.modulePermissions || {};

    // Case-insensitive module lookup
    const moduleKey = Object.keys(modulePermissions).find(
      (key) => key.toLowerCase() === module.toLowerCase(),
    );

    if (!moduleKey) return false;

    const perms = modulePermissions[moduleKey];

    // Check 'all' or specific action
    const allowed = perms.all || perms[action.toLowerCase()];

    return Boolean(allowed);
  } catch (error) {
    console.error("hasPermission error:", error);
    return false;
  }
};
