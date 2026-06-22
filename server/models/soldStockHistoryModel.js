const mongoose = require("mongoose");

const salesHistorySchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        type: {
            type: String,
            enum: ["PURCHASE", "SALE", "RETURN", "ADJUSTMENT"],
            required: true,
        },
        soldQuantity: {
            type: Number,
            required: true,
        },
        referenceNumber: {
            type: String, // e.g. SL007
        },
        sellingPrice: {
            type: Number,
        },
        note: {
            type: String,
        },
    },
    { timestamps: true }
);

// ✅ Connection-scoped model factory
const getSalesHistoryModel = (conn) => {
  if (!conn) {
    return mongoose.models.SalesHistory || mongoose.model("SalesHistory", salesHistorySchema);
  }
  return conn.models.SalesHistory || conn.model("SalesHistory", salesHistorySchema);
};

const forMaster = (conn) => {
  return getSalesHistoryModel(conn);
};

const forTenant = (conn) => {
  return getSalesHistoryModel(conn);
};

const SalesHistoryModel = getSalesHistoryModel();
SalesHistoryModel.forMaster = forMaster;
SalesHistoryModel.forTenant = forTenant;

module.exports = SalesHistoryModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
