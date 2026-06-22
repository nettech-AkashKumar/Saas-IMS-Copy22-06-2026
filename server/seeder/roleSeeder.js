const Role = require("../models/roleModels");
const defaultRoles = [
    {
        roleName: "SuperAdmin",
        status: "Active",
        modulePermissions: {
            users: { read: true, write: true, update: true, delete: true, import: true, export: true, all: true },
            roles: { read: true, write: true, update: true, delete: true, import: true, export: true, all: true },
        },
    },
];

const seedRoles = async (tenantConn) => {
    try {
        if (!tenantConn) {
            throw new Error("Tenant connection required for role seeding");
        }

        const RoleModel = Role.forTenant(tenantConn);

        for (const r of defaultRoles) {
            await RoleModel.findOneAndUpdate(
                { roleName: r.roleName },
                { $setOnInsert: r },
                { upsert: true, new: true }
            );
        }
        console.log("✅ Roles seeded");
    } catch (error) {
        console.error("❌ Role seeded error:", error.message || error);
        throw error;
    }
};

module.exports = seedRoles;