const mongoose = require("mongoose");

const citySchema = new mongoose.Schema({
  cityName: {
    type: String,
    required: true,
    trim: true,
  },
  cityCode: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "State",
    required: true,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country",
    required: true,
  },
}, { timestamps: true });

// ✅ Connection-scoped model factory
const getCityModel = (conn) => {
  if (!conn) {
    return mongoose.models.City || mongoose.model("City", citySchema);
  }
  return conn.models.City || conn.model("City", citySchema);
};

const forMaster = (conn) => {
  return getCityModel(conn);
};

const forTenant = (conn) => {
  return getCityModel(conn);
};

const CityModel = getCityModel();
CityModel.forMaster = forMaster;
CityModel.forTenant = forTenant;

module.exports = CityModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
