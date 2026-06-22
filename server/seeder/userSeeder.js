const User = require("../models/usersModels");
const Role = require("../models/roleModels");
const bcrypt = require("bcryptjs");

const SUPERADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com";
const SUPERADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

const seedSuperAdmin = async (tenantConn) => {
    try {
        if (!tenantConn) {
            throw new Error("Tenant connection required for admin seeding");
        }

        const RoleModel = Role.forTenant(tenantConn);
        const UserModel = User.forTenant(tenantConn);

        const superRole = await RoleModel.findOne({ roleName: "SuperAdmin" });
        if (!superRole) {
            console.warn("⚠️ SuperAdmin role not found. Run role seeder first");
            return;
        }

        const existing = await UserModel.findOne({ email: SUPERADMIN_EMAIL.toLowerCase() });
        if (existing) {
            console.log(`✅ SuperAdmin already exists: ${SUPERADMIN_EMAIL}`);
            return;
        }

        const hashed = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
        const newUser = new UserModel({
            firstName: "Super",
            lastName: "Admin",
            email: SUPERADMIN_EMAIL.toLowerCase(),
            password: hashed,
            role: superRole._id,
            phone: "7645993354",
            country: "India",
            state: "Bihar",
            city: "Patna",
            address: "Patna",
            status: "Active",
            passwordChangedAt: new Date(),
            mustChangePassword: true,
        });

        await newUser.save();
        console.log(`✅ SuperAdmin created: ${SUPERADMIN_EMAIL}`);
    } catch (error) {
        console.error("❌ User seeded error:", error.message || error);
        throw error;
    }
};

module.exports = seedSuperAdmin;