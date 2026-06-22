/**
 * Seed default roles for a new tenant company
 * Called when company registration is confirmed
 *
 * Default roles:
 * - ADMIN: Full permissions
 * - MANAGER: Can manage staff and create documents
 * - EMPLOYEE: Can only read/create own records
 */

const seedDefaultRoles = async (tenantConn) => {
  try {
    if (!tenantConn) {
      throw new Error("Tenant connection required");
    }

    const RoleModel = require("../../models/roleModels");
    const TenantRole = RoleModel.forTenant(tenantConn);

    // Define default roles
    const defaultRoles = [
      {
        roleName: "ADMIN",
        status: "Active",
        modulePermissions: {
          users: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          roles: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          products: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          category: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          brand: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          units: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          color: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          size: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          tax: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          hsn: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          variant: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          invoices: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          sales: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          purchases: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          customers: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          suppliers: { create: true, read: true, update: true, delete: true, export: true, import: true, all: true },
          reports: { create: false, read: true, update: false, delete: false, export: true, import: false, all: true },
          settings: { create: true, read: true, update: true, delete: false, export: false, import: false, all: true },
        },
      },
      {
        roleName: "MANAGER",
        status: "Active",
        modulePermissions: {
          users: { create: true, read: true, update: true, delete: false, export: true, import: false, all: false },
          roles: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          products: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          category: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          brand: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          units: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          color: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          size: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          tax: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          hsn: { create: true, read: true, update: true, delete: false, export: true, import: true, all: false },
          variant: { create: true, read: true, update: true, delete: false, export: false, import: false, all: false },
          invoices: { create: true, read: true, update: true, delete: false, export: true, import: false, all: false },
          sales: { create: true, read: true, update: true, delete: false, export: true, import: false, all: false },
          purchases: { create: true, read: true, update: true, delete: false, export: true, import: false, all: false },
          customers: { create: true, read: true, update: true, delete: false, export: true, import: false, all: false },
          suppliers: { create: true, read: true, update: true, delete: false, export: true, import: false, all: false },
          reports: { create: false, read: true, update: false, delete: false, export: true, import: false, all: false },
          settings: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
        },
      },
      {
        roleName: "EMPLOYEE",
        status: "Active",
        modulePermissions: {
          users: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          roles: { create: false, read: false, update: false, delete: false, export: false, import: false, all: false },
          products: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          category: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          brand: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          units: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          color: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          size: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          tax: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          hsn: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          variant: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          invoices: { create: true, read: true, update: false, delete: false, export: false, import: false, all: false },
          sales: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          purchases: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          customers: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          suppliers: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          reports: { create: false, read: true, update: false, delete: false, export: false, import: false, all: false },
          settings: { create: false, read: false, update: false, delete: false, export: false, import: false, all: false },
        },
      },
    ];

    const createdRoles = [];

    for (const roleData of defaultRoles) {
      let role = await TenantRole.findOne({ roleName: roleData.roleName });

      if (!role) {
        role = await TenantRole.create(roleData);
        console.log(`✅ Created role: ${roleData.roleName}`);
      } else {
        console.log(`✅ Role already exists: ${roleData.roleName}`);
      }

      createdRoles.push(role);
    }

    return createdRoles;
  } catch (err) {
    console.error(`❌ Error seeding default roles:`, err.message);
    throw err;
  }
};

module.exports = seedDefaultRoles;