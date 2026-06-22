const mongoose = require("mongoose")
const LocalizationSettingsSchema = new mongoose.Schema({
    language: { type: String },
    timezone: { type: String },
    dateformat: { type: String },
    timeformat: { type: String },
    financialyear: { type: String },
    startingmonth: { type: String },
    currency: { type: String },
    currencysymbol: { type: String },
    currencyposition: { type: String },
    decimalseparator: { type: String },
    thousandseparator:{type:String}
},
    {
    timestamps:true
})

// ✅ Connection-scoped model factory
const getLocalizationSettingsModel = (conn) => {
  if (!conn) {
    return mongoose.models.LocalizationSettings || mongoose.model("LocalizationSettings", LocalizationSettingsSchema);
  }
  return conn.models.LocalizationSettings || conn.model("LocalizationSettings", LocalizationSettingsSchema);
};

const forMaster = (conn) => {
  return getLocalizationSettingsModel(conn);
};

const forTenant = (conn) => {
  return getLocalizationSettingsModel(conn);
};

const LocalizationSettingsModel = getLocalizationSettingsModel();
LocalizationSettingsModel.forMaster = forMaster;
LocalizationSettingsModel.forTenant = forTenant;

module.exports = LocalizationSettingsModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;