const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Will store "QUOT202604"
  seq: { type: Number, default: 0 }
});

// ✅ Function to get the model for a connection (same pattern as CustomerInvoiceModel)
const getCounterModel = (conn) => {
  return conn.models.Counter || conn.model("Counter", counterSchema);
};

// ✅ Define forMaster and forTenant as functions
const forMaster = (conn) => getCounterModel(conn);
const forTenant = (conn) => getCounterModel(conn);

// ✅ Export exactly like CustomerInvoiceModel
module.exports = {
  forMaster,
  forTenant,
  getCounterModel,
};