const mongoose = require("mongoose");

const printTemplateSchema = new mongoose.Schema({
  // Template Type
  templateType: {
    type: String,
    required: true,
    enum: ["normal", "thermal"],
    default: "normal",
  },

  // Template Name & Selection
  templateName: {
    type: String,
    required: true,
    default: "Default Template",
  },
  selectedTemplate: {
    type: String,
    required: true,
    default: "template1",
  },

  // Layout Configuration (Only store what's specific to template)
  layoutConfig: {
    headerPosition: {
      type: String,
      enum: ["left", "center", "right"],
      default: "center",
    },
    footerPosition: {
      type: String,
      enum: ["left", "center", "right"],
      default: "center",
    },
    fontSize: {
      type: Number,
      default: 12,
      min: 8,
      max: 16,
    },
    margin: {
      top: { type: Number, default: 10 },
      bottom: { type: Number, default: 10 },
      left: { type: Number, default: 10 },
      right: { type: Number, default: 10 },
    },
  },

  // Field Visibility Settings (Only booleans)
  fieldVisibility: {
    // Common fields
    showHSN: { type: Boolean, default: true },
    showRate: { type: Boolean, default: true },
    showTax: { type: Boolean, default: true },
    showDate: { type: Boolean, default: true },
    showTime: { type: Boolean, default: true },

    // Normal print specific
    showTotalsInWords: { type: Boolean, default: true },
    showBankDetails: { type: Boolean, default: true },
    showTermsConditions: { type: Boolean, default: true },

    // Thermal print specific
    showPaymentMode: { type: Boolean, default: true },
    showDueAmount: { type: Boolean, default: true },
    showRewardEarned: { type: Boolean, default: true },
    showGreetings: { type: Boolean, default: true },
  },

  // Company Reference (No need to duplicate company data)
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "companysetting",
  },
  // ADD THIS FIELD FOR SIGNATURE
  signatureUrl: {
    type: String,
    default: "",
  },

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
printTemplateSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure only one default template per type
printTemplateSchema.pre("save", async function (next) {
  if (this.isDefault && this.isModified("isDefault")) {
    await this.constructor.updateMany(
      {
        templateType: this.templateType,
        _id: { $ne: this._id },
      },
      { isDefault: false }
    );
  }
  next();
});

// ✅ Connection-scoped model factory
const getPrintTemplateModel = (conn) => {
  if (!conn) {
    return mongoose.models.PrintTemplate || mongoose.model("PrintTemplate", printTemplateSchema);
  }
  return conn.models.PrintTemplate || conn.model("PrintTemplate", printTemplateSchema);
};

const forMaster = (conn) => {
  return getPrintTemplateModel(conn);
};

const forTenant = (conn) => {
  return getPrintTemplateModel(conn);
};

const PrintTemplateModel = getPrintTemplateModel();
PrintTemplateModel.forMaster = forMaster;
PrintTemplateModel.forTenant = forTenant;

module.exports = PrintTemplateModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
