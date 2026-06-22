const mongoose = require("mongoose");

const barcodeSettingsSchema = new mongoose.Schema({
  // Prefix Settings
  useSamePrefixForAll: {
    type: Boolean,
    default: false
  },
  definePerDocumentType: {
    type: Boolean,
    default: true
  },
  
  // Display Settings
  showBarcodeLabel: {
    type: Boolean,
    default: true
  },
  barcodeHeight: {
    type: Number,
    default: 16,
    min: 10,
    max: 100
  },
  barcodeFontSize: {
    type: Number,
    default: 16,
    min: 8,
    max: 72
  },
  
  // Document Type Settings
  documentTypes: [{
    documentType: {
      type: String,
      required: true,
      enum: ['Invoice', 'Purchase Order', 'Quotation', 'Debit Note', 'Credit Notes']
    },
    format: {
      type: String,
      default: ''
    },
    prefix: {
      type: String,
      default: ''
    },
    suffix: {
      type: String,
      default: ''
    },
    example: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Company Reference
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'companysetting'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
barcodeSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ Connection-scoped model factory
const getBarcodeSettingsModel = (conn) => {
  if (!conn) {
    return mongoose.models.BarcodeSettings || mongoose.model('BarcodeSettings', barcodeSettingsSchema);
  }
  return conn.models.BarcodeSettings || conn.model('BarcodeSettings', barcodeSettingsSchema);
};

const forMaster = (conn) => {
  return getBarcodeSettingsModel(conn);
};

const forTenant = (conn) => {
  return getBarcodeSettingsModel(conn);
};

const BarcodeSettingsModel = getBarcodeSettingsModel();
BarcodeSettingsModel.forMaster = forMaster;
BarcodeSettingsModel.forTenant = forTenant;

module.exports = BarcodeSettingsModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;