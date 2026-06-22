const mongoose = require("mongoose");

const DamageReturnSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 0 },
    remarks: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Connection-scoped model factory
const getDamageReturnModel = (conn) => {
  if (!conn) {
    return mongoose.models.DamageReturn || mongoose.model("DamageReturn", DamageReturnSchema);
  }
  return conn.models.DamageReturn || conn.model("DamageReturn", DamageReturnSchema);
};

const forMaster = (conn) => {
  return getDamageReturnModel(conn);
};

const forTenant = (conn) => {
  return getDamageReturnModel(conn);
};

const DamageReturnModel = getDamageReturnModel();
DamageReturnModel.forMaster = forMaster;
DamageReturnModel.forTenant = forTenant;

module.exports = DamageReturnModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
