const mongoose = require('mongoose');

const DebitNoteSchema = new mongoose.Schema({
  debitNoteId: { type: String, required: true, unique: true },
  referenceNumber: { type: String },
  debitNoteDate: { type: Date },
  dueDate: { type: Date },
  status: { type: String, enum: ['Paid', 'Pending', 'Cancelled'], default: 'Pending' },
  currency: { type: String, default: 'USD' },
  enableTax: { type: Boolean, default: false },
  billFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  billTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      unit: String,
      returnQty: Number, // ✅ Add this line
      purchasePrice: Number,
      discount: Number,
      taxAmount: { type: Number, default: 0 },
       discountType: { type: String, default: "" },
      discountAmount: { type: Number, default: 0 },
      unitCost: Number,
      totalCost: Number,
      tax: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      subTotal: { type: Number, default: 0 },
    },
  ],
  extraInfo: {
    notes: String,
    terms: String,
    bank: String
  },
  amount: Number,
  cgst: Number,
  sgst: Number,
  discount: String,
  roundOff: Boolean,
  total: Number,
  totalInWords: String,
        taxableAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  signature: String,
  signatureName: String,
  signatureImage: String,
  // returnQty: String, // Removed duplicate, only products array should have returnQty
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
}, { timestamps: true });

// ✅ Connection-scoped model factory
const getDebitNoteModel = (conn) => {
  if (!conn) {
    return mongoose.models.DebitNote || mongoose.model('DebitNote', DebitNoteSchema);
  }
  return conn.models.DebitNote || conn.model('DebitNote', DebitNoteSchema);
};

const forMaster = (conn) => {
  return getDebitNoteModel(conn);
};

const forTenant = (conn) => {
  return getDebitNoteModel(conn);
};

const DebitNoteModel = getDebitNoteModel();
DebitNoteModel.forMaster = forMaster;
DebitNoteModel.forTenant = forTenant;

module.exports = DebitNoteModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
