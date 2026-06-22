const mongoose = require("mongoose");
// const assignCategoryCodesToExisting = require('../utils/category/categoryCodeMigrator'); ❌ removed
const connectMasterDB = require("./SaaS/masterDb");
const getTenantDB = require("./SaaS/tenantDb");
const { MONGO_URI, SAAS_MASTER_DB } = require("./SaaS/env");

// ============================
// ✅ MAIN DB CONNECTION
// ============================
// Note: NO default mongoose connection!
// All models are created via connection-scoped factories (forMaster/forTenant)
const connectDB = async () => {
  try {
    // ✅ Validate env variables
    const baseUri = String(MONGO_URI || "").replace(/\/+$/, "");
    const masterDbName = String(SAAS_MASTER_DB || "").replace(/^\/+|\/+$/g, "");

    if (!baseUri) {
      throw new Error("MONGO_URI is not configured");
    }
    if (!masterDbName) {
      throw new Error("SAAS_MASTER_DB is not configured");
    }

    // ✅ Ensure master DB connection is established
    const masterConn = await connectMasterDB();

    console.log(`✅ MongoDB Connected: ${masterConn.name}`);
    return masterConn;
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

// ============================
// ✅ TEST MASTER + TENANT DB
// ============================
const testDBs = async (tenantDbName) => {
  try {
    if (!tenantDbName) {
      throw new Error("tenantDbName is required. No fallback tenant DB is allowed.");
    }

    const master = await connectMasterDB();
    const tenant = await getTenantDB(tenantDbName);

    console.log("✅ Master DB collections:", Object.keys(master.collections));
    console.log("✅ Tenant DB collections:", Object.keys(tenant.collections));
    console.log("🎉 All DBs connected successfully!");

    return { master, tenant };
  } catch (err) {
    console.error("❌ testDBs failed:", err.message || err);
    throw err;
  }
};

// ============================
// ✅ CLOSE DB CONNECTIONS
// ============================
const closeDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("✅ All MongoDB connections closed");
  } catch (err) {
    console.error("❌ Error closing connections:", err.message);
  }
};

// ============================
// ✅ EXPORT
// ============================
module.exports = {
  connectDB,
  closeDB,
  testDBs,
  connectMasterDB,
  getTenantDB,
};
