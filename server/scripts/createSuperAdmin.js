require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectMasterDB = require("../config/masterDb");
const SuperAdmin = require("../models/master/SuperAdmin");

(async () => {
  const db = await connectMasterDB();

  const exists = await SuperAdmin.findOne({
    email: "admin@imsmymunc.com",
  });

  if (exists) {
    console.log("Super admin already exists");
    process.exit();
  }

  const hashed = await bcrypt.hash("Admin@123", 10);

  await SuperAdmin.create({
    email: "admin@imsmymunc.com",
    password: hashed,
  });

  console.log("✅ Super admin created");
  process.exit();
})();
