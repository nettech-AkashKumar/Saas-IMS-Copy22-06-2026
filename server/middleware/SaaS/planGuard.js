const plans = require("../../../../../SAAS/saas-backend/src/config/plans");

module.exports = (feature) => {
  return async (req, res, next) => {
    const tenant = req.tenant;
    const plan = plans[tenant.plan];

    if (!plan) {
      return res.status(403).json({ message: "Invalid plan" });
    }

    if (feature === "EMPLOYEE_CREATE") {
      const Employee = require("../models/tenant/Employee")(req.db);
      const count = await Employee.countDocuments();

      if (count >= plan.employees) {
        return res
          .status(403)
          .json({ message: "Employee limit exceeded. Upgrade plan." });
      }
    }

    next();
  };
};
