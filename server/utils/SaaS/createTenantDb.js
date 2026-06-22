const getTenantDB = require("../../config/SaaS/tenantDb");
const User = require("../../models/usersModels");

const createTenantDb = async (dbName, adminData) => {
  const tenantConn = await getTenantDB(dbName);
  const Employee = User.forTenant(tenantConn);

  // Create default admin
  const admin = new Employee({
    name: adminData.name,
    email: adminData.email,
    password: adminData.password,
    role: "ADMIN",
  });

  await admin.save();
  console.log(`✅ Tenant DB ${dbName} ready with admin`);
  return tenantConn;
};

module.exports = createTenantDb;
