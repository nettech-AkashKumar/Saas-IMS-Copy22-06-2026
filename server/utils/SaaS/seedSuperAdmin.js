const bcrypt = require("bcryptjs");
const connectMasterDB = require("../../config/SaaS/masterDb");
const SuperAdminModel = require("../../models/SaaS/master/SuperAdmin");

module.exports = async () => {
  const masterDB = await connectMasterDB();
  const SuperAdmin = SuperAdminModel(masterDB);

  const exists = await SuperAdmin.findOne({ email: "admin@imsmymunc.com" });
  if (exists) return;

  const hashed = await bcrypt.hash("Admin@123", 10);

  await SuperAdmin.create({
    name: "Main Super Admin",          // ✅ REQUIRED
    email: "admin@imsmymunc.com",
    password: hashed,
  });

  console.log("✅ Super Admin seeded");
};
