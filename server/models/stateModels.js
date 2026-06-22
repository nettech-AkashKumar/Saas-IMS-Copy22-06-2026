const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
  stateName: {
    type: String,
    required: true,
  },
  stateCode: {
    type: String,
    required: true,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country", // Reference to Country model
    required: true,
  },
  cities:    [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "City", // Reference to Country model
    required: true,
  }],      // ← embeds cities
}, { timestamps: true });

// ✅ Connection-scoped model factory
const getStateModel = (conn) => {
  if (!conn) {
    return mongoose.models.State || mongoose.model("State", stateSchema);
  }
  return conn.models.State || conn.model("State", stateSchema);
};

const forMaster = (conn) => {
  return getStateModel(conn);
};

const forTenant = (conn) => {
  return getStateModel(conn);
};

const StateModel = getStateModel();
StateModel.forMaster = forMaster;
StateModel.forTenant = forTenant;

module.exports = StateModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
