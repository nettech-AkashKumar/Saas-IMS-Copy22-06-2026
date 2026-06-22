const mongoose = require("mongoose");

const VarientSchema = new mongoose.Schema({
    variant: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
    },

    status: {
        type: Boolean,
        default: false
    },

},
    {
        timestamps: true
    });

// ✅ Connection-scoped model factory
const getVarientModel = (conn) => {
  if (!conn) {
    return mongoose.models.Varient || mongoose.model("Varient", VarientSchema);
  }
  return conn.models.Varient || conn.model("Varient", VarientSchema);
};

const forMaster = (conn) => {
  return getVarientModel(conn);
};

const forTenant = (conn) => {
  return getVarientModel(conn);
};

const VarientModel = getVarientModel();
VarientModel.forMaster = forMaster;
VarientModel.forTenant = forTenant;

module.exports = VarientModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;