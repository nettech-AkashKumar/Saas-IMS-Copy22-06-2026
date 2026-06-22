const mongoose = require("mongoose");

const WarrantySchema = new mongoose.Schema({
    warranty: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    // duration: {
    //     type: String,
    //     required: true,
    // },
    status: {
        type: Boolean,
        default: false
    },
    toDate: {
        type: Date,
        required: true,
    },
    fromDate: {
        type: Date,
        required: true,
    }

},
    {
        timestamps: true
    });

// ✅ Connection-scoped model factory
const getWarrantyModel = (conn) => {
  if (!conn) {
    return mongoose.models.Warranty || mongoose.model("Warranty", WarrantySchema);
  }
  return conn.models.Warranty || conn.model("Warranty", WarrantySchema);
};

const forMaster = (conn) => {
  return getWarrantyModel(conn);
};

const forTenant = (conn) => {
  return getWarrantyModel(conn);
};

const WarrantyModel = getWarrantyModel();
WarrantyModel.forMaster = forMaster;
WarrantyModel.forTenant = forTenant;

module.exports = WarrantyModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;