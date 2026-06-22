require("dotenv").config();
const connectMasterDB = require("./config/masterDb");
const getTenantDB = require("./config/tenantDb");

async function testDBs() {
  try {
    // 1️⃣ Master DB
    const master = await connectMasterDB();

    // 2️⃣ Tenant DB
    const tenant = await getTenantDB("abc_ims_db"); // replace with your test tenant

    console.log("✅ Master DB collections:", Object.keys(master.collections));
    console.log("✅ Tenant DB collections:", Object.keys(tenant.collections));

    console.log("🎉 All DBs connected successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testDBs();
