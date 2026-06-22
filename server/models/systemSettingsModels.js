const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
    {
        category: {
            type: Boolean,
            default: false,
        },
        subcategory: {
            type: Boolean,
            default: false,
        },
        brand: {
            type: Boolean,
            default: false,
        },
        description: {
            type: Boolean,
            default: false,
        },
        itembarcode: {
            type: Boolean,
            default: false,
        },
        hsn: {
            type: Boolean,
            default: false,
        },
        units: {
            type: Boolean,
            default: false,
        },
        lotno: {
            type: Boolean,
            default: false,
        },
        pricing: {
            type: Boolean,
            default: false,
        },
        serialno: {           
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // ✅ This adds createdAt and updatedAt automatically
    }
);

// ✅ Connection-scoped model factory
const getSystemSettingsModel = (conn) => {
  if (!conn) {
    return mongoose.models.SystemSettings || mongoose.model("SystemSettings", systemSettingsSchema);
  }
  return conn.models.SystemSettings || conn.model("SystemSettings", systemSettingsSchema);
};

const forMaster = (conn) => {
  return getSystemSettingsModel(conn);
};

const forTenant = (conn) => {
  return getSystemSettingsModel(conn);
};

const SystemSettingsModel = getSystemSettingsModel();
SystemSettingsModel.forMaster = forMaster;
SystemSettingsModel.forTenant = forTenant;

module.exports = SystemSettingsModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;