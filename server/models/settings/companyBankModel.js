const mongoose = require("mongoose");

const companyBankSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "companysetting",
      required: true,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
    },

    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      required: true,
    },

    ifsc: {
      type: String,
      required: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"],
    },

    branch: {
      type: String,
    },

    upiId: {
      type: String,
    },

    qrCode: {
      type: String, // image path
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Connection-scoped model factory
const getCompanyBankModel = (conn) => {
  if (!conn) {
    return mongoose.models.companyBank || mongoose.model("companyBank", companyBankSchema);
  }
  return conn.models.companyBank || conn.model("companyBank", companyBankSchema);
};

const forMaster = (conn) => {
  return getCompanyBankModel(conn);
};

const forTenant = (conn) => {
  return getCompanyBankModel(conn);
};

const CompanyBankModel = getCompanyBankModel();
CompanyBankModel.forMaster = forMaster;
CompanyBankModel.forTenant = forTenant;

module.exports = CompanyBankModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
