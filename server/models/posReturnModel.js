const mongoose = require('mongoose');

const posReturnItemSchema = new mongoose.Schema(
  {
    saleItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    productName: { type: String },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    unit: { type: String },
    serialNumbers: [{ type: String }],
    refundableAmount: { type: Number, required: true },
    status: { type: String, enum: ['Return'], default: 'Return' },
  },
  { _id: false },
);

const posReturnSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, index: true },
    posSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PosSale',
      required: true,
      index: true,
    },
    customer: {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
      name: String,
      phone: String,
      email: String,
    },
    items: [posReturnItemSchema],
    paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Split'], required: true },
    totalRefundAmount: { type: Number, required: true },
    returnDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: false },
  },
  { timestamps: true },
);

const getPosReturnModel = (conn) => {
  if (!conn) {
    return mongoose.models.PosReturn || mongoose.model('PosReturn', posReturnSchema);
  }
  return conn.models.PosReturn || conn.model('PosReturn', posReturnSchema);
};

const forMaster = (conn) => getPosReturnModel(conn);
const forTenant = (conn) => getPosReturnModel(conn);

const PosReturnModel = getPosReturnModel();
PosReturnModel.forMaster = forMaster;
PosReturnModel.forTenant = forTenant;

module.exports = PosReturnModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
