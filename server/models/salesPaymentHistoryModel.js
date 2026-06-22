const mongoose = require("mongoose");

const paymentHistorySchema = new mongoose.Schema({
    sale: { type: mongoose.Schema.Types.ObjectId, ref: "Sales" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    paymentType: { type: String, enum: ["Full", "Partial", "Unpaid"], default: "Unpaid" },
    paymentStatus: { type: String, enum: ["Paid", "Partial", "Unpaid"], default: "Unpaid" },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: { type: String }, // Cash / Bank / Online
    transactionId: { type: String },
    transactionDate: { type: Date, default: Date.now },
    notes: { type: String },
}, { timestamps: true });

// ✅ Connection-scoped model factory
const getPaymentHistoryModel = (conn) => {
  if (!conn) {
    return mongoose.models.PaymentHistory || mongoose.model("PaymentHistory", paymentHistorySchema);
  }
  return conn.models.PaymentHistory || conn.model("PaymentHistory", paymentHistorySchema);
};

const forMaster = (conn) => {
  return getPaymentHistoryModel(conn);
};

const forTenant = (conn) => {
  return getPaymentHistoryModel(conn);
};

const PaymentHistoryModel = getPaymentHistoryModel();
PaymentHistoryModel.forMaster = forMaster;
PaymentHistoryModel.forTenant = forTenant;

module.exports = PaymentHistoryModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
