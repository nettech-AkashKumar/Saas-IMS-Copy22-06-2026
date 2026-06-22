const bcrypt = require("bcryptjs");
const EmployeeSchema = require("../models/tenant/Employee.schema");

module.exports = async (tenantDB, admin) => {
  if (!admin.password) {
    throw new Error("Admin password is missing");
  }

  const Employee = tenantDB.model("Employee", EmployeeSchema);

  const exists = await Employee.findOne({ email: admin.email });
  if (exists) return;

  const hashedPassword = await bcrypt.hash(admin.password, 10);

  await Employee.create({
    name: admin.name,
    email: admin.email,
    password: hashedPassword,
    role: "ADMIN",
  });
};
