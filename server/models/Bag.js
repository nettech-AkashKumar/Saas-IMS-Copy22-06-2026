const mongoose = require("mongoose");

const bagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Connection-scoped model factory
const getBagModel = (conn) => {
  if (!conn) {
    return mongoose.models.Bag || mongoose.model("Bag", bagSchema);
  }
  return conn.models.Bag || conn.model("Bag", bagSchema);
};

const forMaster = (conn) => {
  return getBagModel(conn);
};

const forTenant = (conn) => {
  return getBagModel(conn);
};

const BagModel = getBagModel();
BagModel.forMaster = forMaster;
BagModel.forTenant = forTenant;

module.exports = BagModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
