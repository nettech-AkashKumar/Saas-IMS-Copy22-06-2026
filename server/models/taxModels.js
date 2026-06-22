const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema(
  {
    taxName: {
      type: String,
      required: true,
      trim: true,
    },
    taxShortName: {
      type: String,
      required: true,
      trim: true,
    },
    taxRate: {
      type: Number,
      required: true,
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
const getTaxModel = (conn) => {
  if (!conn) {
    return mongoose.models.tax || mongoose.model("tax", taxSchema);
  }
  return conn.models.tax || conn.model("tax", taxSchema);
};

const forMaster = (conn) => {
  return getTaxModel(conn);
};

const forTenant = (conn) => {
  return getTaxModel(conn);
};

const TaxModel = getTaxModel();
TaxModel.forMaster = forMaster;
TaxModel.forTenant = forTenant;

module.exports = TaxModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
