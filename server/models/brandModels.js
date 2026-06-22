const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true },

    image: [
      {
        url: String,
        public_id: String,
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Connection-scoped model factory
const getBrandModel = (conn) => {
  if (!conn) {
    return mongoose.models.Brand || mongoose.model("Brand", brandSchema);
  }
  return conn.models.Brand || conn.model("Brand", brandSchema);
};

const forMaster = (conn) => {
  return getBrandModel(conn);
};

const forTenant = (conn) => {
  return getBrandModel(conn);
};

const BrandModel = getBrandModel();
BrandModel.forMaster = forMaster;
BrandModel.forTenant = forTenant;

module.exports = BrandModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
