const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema(
  {
    colorName: {
      type: String,
      required: true,
      unique: true,
    },
    colorCode: {
      type: String,
      required: true,
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
const getColorModel = (conn) => {
  if (!conn) {
    return mongoose.models.Color || mongoose.model("Color", colorSchema);
  }
  return conn.models.Color || conn.model("Color", colorSchema);
};

const forMaster = (conn) => {
  return getColorModel(conn);
};

const forTenant = (conn) => {
  return getColorModel(conn);
};

const ColorModel = getColorModel();
ColorModel.forMaster = forMaster;
ColorModel.forTenant = forTenant;

module.exports = ColorModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
