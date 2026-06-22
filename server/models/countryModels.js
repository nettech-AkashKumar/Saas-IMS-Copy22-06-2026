const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

// ✅ Connection-scoped model factory
const getCountryModel = (conn) => {
  if (!conn) {
    return mongoose.models.Country || mongoose.model("Country", countrySchema);
  }
  return conn.models.Country || conn.model("Country", countrySchema);
};

const forMaster = (conn) => {
  return getCountryModel(conn);
};

const forTenant = (conn) => {
  return getCountryModel(conn);
};

const CountryModel = getCountryModel();
CountryModel.forMaster = forMaster;
CountryModel.forTenant = forTenant;

module.exports = CountryModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
