// models/Settings.js
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    currencyCode: { type: String, default: "INR" },
    currencySymbol: { type: String, default: "₹" },
    conversionRate: { type: Number, default: 1 },
    percentageSymbol: { type: String, default: "%" },

    //   conversionRates: {
    //     type: Map,
    //     of: Number, // e.g., { USD: 1, INR: 83.2, EUR: 0.91 }
    //     default: {},
    //   },
});

// ✅ Connection-scoped model factory
const getSettingsModel = (conn) => {
  if (!conn) {
    return mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
  }
  return conn.models.Settings || conn.model('Settings', settingsSchema);
};

const forMaster = (conn) => {
  return getSettingsModel(conn);
};

const forTenant = (conn) => {
  return getSettingsModel(conn);
};

const SettingsModel = getSettingsModel();
SettingsModel.forMaster = forMaster;
SettingsModel.forTenant = forTenant;

module.exports = SettingsModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
