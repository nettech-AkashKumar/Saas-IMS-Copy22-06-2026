const mongoose = require("mongoose");

const EWBSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
    },

    deliveryChallanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryChallan",
      default: null,
    },

    ewayBillNo: {
      type: String,
      default: "",
    },

    userGstin: {
      type: String,
      required: true,
    },

    customerGSTIN: {
      type: String,
      default: "",
    },

    vehicleNo: {
      type: String,
      default: "",
    },

    totalValue: {
      type: Number,
      default: 0,
    },

    // ✅ FIXED: DATE TYPE (IMPORTANT)
    ewayBillDate: {
      type: Date,
      default: null,
    },

    validUpto: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["GENERATED", "CANCELLED", "FAILED"],
      default: "GENERATED",
    },

    errorMessage: {
      type: String,
      default: "",
    },

    apiResponse: {
      type: Object,
      default: {},
    },

    cancelReason: {
      type: String,
      default: "",
    },

    cancelRemark: {
      type: String,
      default: "",
    },

    cancelResponse: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Safe model getter
const getEWBModel = (conn) => {
  if (!conn) {
    return mongoose.models.EWB || mongoose.model("EWB", EWBSchema);
  }

  return conn.models.EWB || conn.model("EWB", EWBSchema);
};

const forMaster = (conn) => getEWBModel(conn);
const forTenant = (conn) => getEWBModel(conn);

const EWBModel = getEWBModel();

EWBModel.forMaster = forMaster;
EWBModel.forTenant = forTenant;

module.exports = EWBModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;