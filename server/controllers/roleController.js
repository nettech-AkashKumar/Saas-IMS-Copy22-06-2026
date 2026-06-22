// controllers/roleController.js
const Role = require("../models/roleModels");
const Users = require("../models/usersModels");
const connectMasterDB = require("../config/SaaS/masterDb");
const getTenantDB = require("../config/SaaS/tenantDb");
const CompanyModelFactory = require("../models/SaaS/master/Company.model");

const resolveRoleModels = async (subdomain) => {
  const normalizedSubdomain = String(subdomain || "").trim().toLowerCase();

  if (normalizedSubdomain) {
    const masterConn = await connectMasterDB();
    const Company = CompanyModelFactory(masterConn);
    const company = await Company.findOne({ subdomain: normalizedSubdomain });

    if (!company) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const tenantConn = await getTenantDB(company.dbName);
    return {
      company,
      RoleModel: Role.forTenant(tenantConn),
      UserModel: Users.forTenant(tenantConn),
    };
  }

  const masterConn = await connectMasterDB();
  return {
    company: null,
    RoleModel: Role.forMaster(masterConn),
    UserModel: Users.forMaster(masterConn),
  };
};

const normalizePermissions = (modulePermissions = {}) => {
  const enhancedPermissions = {};
  const entries = modulePermissions instanceof Map
    ? Array.from(modulePermissions.entries())
    : Object.entries(modulePermissions || {});

  entries.forEach(([module, perms = {}]) => {
    const permissionValues = perms || {};
    const all =
      Boolean(permissionValues.all) ||
      (Boolean(permissionValues.create) &&
        Boolean(permissionValues.read) &&
        Boolean(permissionValues.update) &&
        Boolean(permissionValues.delete) &&
        Boolean(permissionValues.export) &&
        Boolean(permissionValues.import));

    enhancedPermissions[module] = {
      create: all || Boolean(permissionValues.create),
      read: all || Boolean(permissionValues.read),
      update: all || Boolean(permissionValues.update),
      delete: all || Boolean(permissionValues.delete),
      export: all || Boolean(permissionValues.export),
      import: all || Boolean(permissionValues.import),
      all,
    };
  });

  return enhancedPermissions;
};

// Create role with only modulePermissions
exports.createRole = async (req, res) => {
  try {
    const { RoleModel } = await resolveRoleModels(
      req.body.subdomain || req.query?.subdomain || req.user?.tenant?.subdomain
    );
    const { roleName, status, modulePermissions = {} } = req.body;

    if (!roleName) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const trimmedRoleName = String(roleName).trim();
    const existingRole = await RoleModel.findOne({ roleName: trimmedRoleName });
    if (existingRole) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const newRole = new RoleModel({
      roleName: trimmedRoleName,
      status: status || "Active",
      modulePermissions: normalizePermissions(modulePermissions),
    });

    await newRole.save();

    return res.status(201).json({
      message: "Role created successfully",
      role: newRole,
    });
  } catch (error) {
    console.error("Create role error:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Server error",
      error: error.message,
    });
  }
};

// Get all roles with member count
exports.getAllRoles = async (req, res) => {
  try {
    const { RoleModel } = await resolveRoleModels(
      req.query.subdomain || req.user?.tenant?.subdomain
    );

    const roles = await RoleModel.find()
      .sort({ createdAt: -1 })
      .populate("memberCount", "count");

    // Format response with member count
    const formattedRoles = roles.map((role) => ({
      _id: role._id,
      roleName: role.roleName,
      status: role.status,
      modulePermissions: role.modulePermissions,
      memberCount: role.memberCount || 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    res.status(200).json(formattedRoles);
  } catch (error) {
    console.error("Get all roles error:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Error fetching roles",
      error: error.message,
    });
  }
};

// Get role by ID with member count
exports.getRoleById = async (req, res) => {
  try {
    const { RoleModel } = await resolveRoleModels(
      req.query.subdomain || req.user?.tenant?.subdomain
    );
    const { id } = req.params;

    // Add validation for invalid IDs
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        message: "Invalid role ID provided",
      });
    }

    // Optional: Add MongoDB ObjectId validation
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid role ID format",
      });
    }

    const role = await RoleModel.findById(id).populate("memberCount", "count");

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const formattedRole = {
      _id: role._id,
      roleName: role.roleName,
      status: role.status,
      modulePermissions: role.modulePermissions,
      memberCount: role.memberCount || 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    res.status(200).json(formattedRole);
  } catch (error) {
    console.error("Error fetching role by ID:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Server error",
      error: error.message,
    });
  }
};

// Get only active roles (for dropdowns)
exports.getActiveRoles = async (req, res) => {
  try {
    const { RoleModel } = await resolveRoleModels(
      req.query.subdomain || req.user?.tenant?.subdomain
    );

    const activeRoles = await RoleModel.find({ status: "Active" })
      .sort({ createdAt: -1 })
      .populate("memberCount", "count");

    // Format for react-select
    const formattedRoles = activeRoles.map((role) => ({
      label: role.roleName,
      value: role._id,
      memberCount: role.memberCount || 0,
      // Include all permissions if needed for frontend
      permissions: role.modulePermissions,
    }));

    res.status(200).json(formattedRoles);
  } catch (error) {
    console.error("Get active roles error:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Error fetching active roles",
      error: error.message,
    });
  }
};

// Update role
exports.updateRole = async (req, res) => {
  try {
    const { RoleModel } = await resolveRoleModels(
      req.body.subdomain || req.query?.subdomain || req.user?.tenant?.subdomain
    );
    const { roleName, status, modulePermissions } = req.body;

    const updateData = {};
    if (roleName) updateData.roleName = String(roleName).trim();
    if (status) updateData.status = status;
    if (modulePermissions) {
      updateData.modulePermissions = normalizePermissions(modulePermissions);
    }

    const role = await RoleModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({
      message: "Role updated successfully",
      role,
    });
  } catch (error) {
    console.error("Update role error:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete role (with check for assigned users)
exports.deleteRole = async (req, res) => {
  try {
    const { RoleModel, UserModel } = await resolveRoleModels(
      req.body?.subdomain || req.query?.subdomain || req.user?.tenant?.subdomain
    );
    const roleId = req.params.id;

    const userCount = await UserModel.countDocuments({ role: roleId });

    if (userCount > 0) {
      return res.status(400).json({
        message: `Cannot delete role. ${userCount} user(s) are assigned to this role.`,
      });
    }

    const role = await RoleModel.findByIdAndDelete(roleId);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({
      message: "Role deleted successfully",
      deletedRole: role,
    });
  } catch (error) {
    console.error("Delete role error:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: "Error deleting role",
      error: error.message,
    });
  }
};

// Get role member count
exports.getRoleMemberCount = async (req, res) => {
  try {
    const { UserModel } = await resolveRoleModels(
      req.query?.subdomain || req.user?.tenant?.subdomain
    );
    const roleId = req.params.id;
    const count = await UserModel.countDocuments({ role: roleId });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Get role member count error:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update role status
exports.updateRoleStatus = async (req, res) => {
  try {
    const { RoleModel } = await resolveRoleModels(
      req.body.subdomain || req.query?.subdomain || req.user?.tenant?.subdomain
    );
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const role = await RoleModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({
      message: "Role status updated successfully",
      role,
    });
  } catch (error) {
    console.error("Update role status error:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Duplicate role
exports.duplicateRole = async (req, res) => {
  try {
    const { RoleModel } = await resolveRoleModels(
      req.body.subdomain || req.query?.subdomain || req.user?.tenant?.subdomain
    );
    const roleId = req.params.id;
    const { newRoleName } = req.body;

    if (!newRoleName) {
      return res.status(400).json({ message: "New role name is required" });
    }

    // Check if new role name already exists
    const existingRole = await RoleModel.findOne({ roleName: newRoleName });
    if (existingRole) {
      return res.status(400).json({ message: "Role name already exists" });
    }

    // Get original role
    const originalRole = await RoleModel.findById(roleId);
    if (!originalRole) {
      return res.status(404).json({ message: "Original role not found" });
    }

    // Create duplicate with new name
    const duplicateRole = new RoleModel({
      roleName: newRoleName,
      status: originalRole.status,
      modulePermissions: originalRole.modulePermissions,
    });

    await duplicateRole.save();

    res.status(201).json({
      message: "Role duplicated successfully",
      role: duplicateRole,
    });
  } catch (error) {
    console.error("Duplicate role error:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// POST /api/roles/assign-permissions
exports.assignPermissions = async (req, res) => {
  const { roleId, permissions } = req.body;
  try {
    const { RoleModel } = await resolveRoleModels(
      req.body.subdomain || req.query?.subdomain || req.user?.tenant?.subdomain
    );
    const role = await RoleModel.findById(roleId);
    if (!role) return res.status(404).json({ message: "Role not found" });

    role.modulePermissions = normalizePermissions(permissions);
    await role.save();

    res.status(200).json({
      message: "Permissions updated successfully",
      role,
    });
  } catch (err) {
    console.error("Assign permissions error:", err);
    if (res.headersSent) return;
    return res.status(err.statusCode || 500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
