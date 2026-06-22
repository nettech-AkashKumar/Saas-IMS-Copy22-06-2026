require("dotenv").config();
const getTenantDB = require("../config/SaaS/tenantDb");
const seedRoles = require("./roleSeeder");
const seedSuperAdmin = require("./userSeeder");

const TENANT_DB_NAME = process.env.SEED_TENANT_DB || "master_db";

const runSeed = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is required in .env");
        }

        console.log(`🔌 Connecting to tenant DB for seeding: ${TENANT_DB_NAME}`);
        const tenantConn = await getTenantDB(TENANT_DB_NAME);
        console.log("✅ Tenant DB connected for seeding");

        await seedRoles(tenantConn);
        await seedSuperAdmin(tenantConn);

        console.log("✅ Seeding finished");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error.message || error);
        process.exit(1);
    }
};

if (require.main === module) runSeed();
module.exports = { runSeed };