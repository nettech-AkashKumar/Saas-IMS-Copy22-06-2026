const mongoose = require("mongoose");

const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const companysettingSchema = new mongoose.Schema({
  // Basic Information
  companyName: { type: String, required: true },
  companyTitle: { type: String, default: "" },
  companyemail: { type: String, required: true },
  companyphone: { type: String, required: true },
  website: { type: String },
  gstin: { type: String, match: [gstinRegex, "Invalid GSTIN format"] },
  panNo: { type: String, match: [panRegex, "Invalid PAN format"] },
  state: { type: String },
  district: { type: String },
  pincode: { type: String },
  businessType: { type: String },
  alternativePhone: { type: String },
  companyfax: { type: String },

  billingAddress: { type: String, required: true },
  shippingAddress: { type: String, required: true },
  companyaddress: { type: String, required: true },
  companycountry: { type: String, default: "India" },
  companystate: { type: String },
  companycity: { type: String },
  companypostalcode: { type: String },
  
  cin: { type: String },
  companydescription: { type: String },
  companyLogo: { type: String },
  companyFavicon: { type: String },
  companyIcon: { type: String },
  companyDarkLogo: { type: String },

}, {
  timestamps: true,
});

// Add validation for phone numbers
companysettingSchema.pre('save', function (next) {
  if (this.companyphone && !/^[0-9]{10}$/.test(this.companyphone)) {
    next(new Error('Invalid company phone number'));
  }
  if (this.alternativePhone && !/^[0-9]{10}$/.test(this.alternativePhone)) {
    next(new Error('Invalid alternative phone number'));
  }
  next();
});

// ✅ Connection-scoped model factory
const getCompanySettingModel = (conn) => {
  if (!conn) {
    return mongoose.models.companysetting || mongoose.model("companysetting", companysettingSchema);
  }
  return conn.models.companysetting || conn.model("companysetting", companysettingSchema);
};

const forMaster = (conn) => {
  return getCompanySettingModel(conn);
};

const forTenant = (conn) => {
  return getCompanySettingModel(conn);
};

const CompanySettingModel = getCompanySettingModel();
CompanySettingModel.forMaster = forMaster;
CompanySettingModel.forTenant = forTenant;

module.exports = CompanySettingModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;