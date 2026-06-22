const mongoose = require("mongoose");

const taxGstSchema = new mongoose.Schema(
  {
    // GST Settings
    enableGSTBilling: {
      type: Boolean,
      default: true
    },

    defaultGSTRate: {
      type: String,
      enum: ["0", "5", "12", "18", "28", ""],
      default: "18"
    },

    priceIncludeGST: {
      type: Boolean,
      default: true
    },

    // Round Off Settings
    autoRoundOff: {
      type: String,
      enum: ["0", "standard", "1", "5", "10"],
      default: "0"
    },

    // Status
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Create a single document
taxGstSchema.statics.getSingleSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Factory pattern for tenant-aware models
const getModelName = (conn) => {
  if (!conn) {
    return mongoose.models.TaxGst || mongoose.model("TaxGst", taxGstSchema);
  }
  return conn.models.TaxGst || conn.model("TaxGst", taxGstSchema);
};

const forMaster = (conn) => getModelName(conn);
const forTenant = (conn) => getModelName(conn);
const TaxGstModel = getModelName();
TaxGstModel.forTenant = forTenant;
TaxGstModel.forMaster = forMaster;

module.exports = TaxGstModel;
module.exports.forTenant = forTenant;