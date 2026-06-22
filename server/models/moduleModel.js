const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ Connection-scoped model factory
const getModuleModel = (conn) => {
  if (!conn) {
    return mongoose.models.Module || mongoose.model("Module", moduleSchema);
  }
  return conn.models.Module || conn.model("Module", moduleSchema);
};

const forMaster = (conn) => {
  return getModuleModel(conn);
};

const forTenant = (conn) => {
  return getModuleModel(conn);
};

const ModuleModel = getModuleModel();
ModuleModel.forMaster = forMaster;
ModuleModel.forTenant = forTenant;

module.exports = ModuleModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
