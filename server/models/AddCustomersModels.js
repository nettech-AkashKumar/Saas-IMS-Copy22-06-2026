const mongoose = require("mongoose");

const AddCustomersSchema = new mongoose.Schema(
  {
    addcustomers: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Connection-scoped model factory
const getAddCustomerModel = (conn) => {
  if (!conn) {
    return mongoose.models.AddCustomer || mongoose.model("AddCustomer", AddCustomersSchema);
  }
  return conn.models.AddCustomer || conn.model("AddCustomer", AddCustomersSchema);
};

const forMaster = (conn) => {
  return getAddCustomerModel(conn);
};

const forTenant = (conn) => {
  return getAddCustomerModel(conn);
};

const AddCustomerModel = getAddCustomerModel();
AddCustomerModel.forMaster = forMaster;
AddCustomerModel.forTenant = forTenant;

module.exports = AddCustomerModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;

