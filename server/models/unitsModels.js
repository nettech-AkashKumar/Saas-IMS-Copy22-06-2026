const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    unitsName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    shortName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // ✅ This adds createdAt and updatedAt automatically
  }
);

// ✅ Connection-scoped model factory
const getUnitModel = (conn) => {
  if (!conn) {
    return mongoose.models.Unit || mongoose.model("Unit", unitSchema);
  }
  return conn.models.Unit || conn.model("Unit", unitSchema);
};

const forMaster = (conn) => {
  return getUnitModel(conn);
};

const forTenant = (conn) => {
  return getUnitModel(conn);
};

const UnitModel = getUnitModel();
UnitModel.forMaster = forMaster;
UnitModel.forTenant = forTenant;

module.exports = UnitModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
