const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema(
  {
    sizeName: {
      type: String,
      required: true,
      unique: true,
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true, // ✅ This adds createdAt and updatedAt automatically
  }
);

// ✅ Connection-scoped model factory
const getSizeModel = (conn) => {
  if (!conn) {
    return mongoose.models.Size || mongoose.model("Size", sizeSchema);
  }
  return conn.models.Size || conn.model("Size", sizeSchema);
};

const forMaster = (conn) => {
  return getSizeModel(conn);
};

const forTenant = (conn) => {
  return getSizeModel(conn);
};

const SizeModel = getSizeModel();
SizeModel.forMaster = forMaster;
SizeModel.forTenant = forTenant;

module.exports = SizeModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
