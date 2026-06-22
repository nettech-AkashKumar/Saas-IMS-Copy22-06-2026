const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Failed", "Settled", "Unsettled"],
      required: true,
    },
    expenseTitle: { type: String, required: true },
    notes: { type: String },
    paymentMode: { type: String },
    paidTo: { type: String },
    amount: { type: Number, required: true },
    receipt: [
      {
        url: { type: String, },
        public_id: { type: String, },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Connection-scoped model factory
const getExpenseModel = (conn) => {
  if (!conn) {
    return mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
  }
  return conn.models.Expense || conn.model("Expense", expenseSchema);
};

const forMaster = (conn) => {
  return getExpenseModel(conn);
};

const forTenant = (conn) => {
  return getExpenseModel(conn);
};

const ExpenseModel = getExpenseModel();
ExpenseModel.forMaster = forMaster;
ExpenseModel.forTenant = forTenant;

module.exports = ExpenseModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
