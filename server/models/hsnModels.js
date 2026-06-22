const mongoose = require("mongoose");

const hsnSchema = new mongoose.Schema({
    hsnCode: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    gstRate: {
        type: Number,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// ✅ Connection-scoped model factory
const getHSNModel = (conn) => {
  if (!conn) {
    return mongoose.models.HSN || mongoose.model('HSN', hsnSchema);
  }
  return conn.models.HSN || conn.model('HSN', hsnSchema);
};

const forMaster = (conn) => {
  return getHSNModel(conn);
};

const forTenant = (conn) => {
  return getHSNModel(conn);
};

const HSNModel = getHSNModel();
HSNModel.forMaster = forMaster;
HSNModel.forTenant = forTenant;

module.exports = HSNModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
