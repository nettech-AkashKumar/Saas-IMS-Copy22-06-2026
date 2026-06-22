const mongoose = require("mongoose");

const notesTermsSchema = new mongoose.Schema(
  {
    footerLine1: {
      type: String,
      default: "Thank you for your business!",
      maxlength: 500,
    },

    footerLine2: {
      type: String,
      default: "We appreciate your trust in us.",
      maxlength: 500,
    },

    notesText: {
      type: String,
      default:
        "Please make payment within 30 days.\nAll prices are inclusive of GST.\nGoods once sold will not be taken back.",
      maxlength: 1000,
    },

    termsText: {
      type: String,
      default:
        "1. All disputes are subject to [City] jurisdiction.\n2. Payment should be made within the credit period.\n3. Interest @18% p.a. will be charged on overdue payments.\n4. Goods are non-returnable unless otherwise specified.",
      maxlength: 2000,
    },

    loyaltyMessage: {
      type: String,
      default:
        "Thank you for being a valued customer! You have earned shopping points on this purchase that can be redeemed on your next purchase.",
      maxlength: 500,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ✅ Connection-scoped model factory
const getNotesTermsModel = (conn) => {
  if (!conn) {
    return mongoose.models.NotesTerms || mongoose.model("NotesTerms", notesTermsSchema);
  }
  return conn.models.NotesTerms || conn.model("NotesTerms", notesTermsSchema);
};

const forMaster = (conn) => {
  return getNotesTermsModel(conn);
};

const forTenant = (conn) => {
  return getNotesTermsModel(conn);
};

const NotesTermsModel = getNotesTermsModel();
NotesTermsModel.forMaster = forMaster;
NotesTermsModel.forTenant = forTenant;

module.exports = NotesTermsModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
