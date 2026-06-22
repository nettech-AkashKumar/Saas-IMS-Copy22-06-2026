const mongoose = require('mongoose');

const purchaseReturnSchema = new mongoose.Schema({
    referenceNumber: String,
    originalPurchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    returnDate: { type: Date, default: Date.now },
    returnedProducts: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: Number,
            purchasePrice: Number,
        },
    ],
    reason: String,
    refundMethod: {
        type: String,
        enum: ['Cash', 'Online', 'Credit'],
    },
    refundStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Rejected'],
        default: 'Pending',
    },
    notes: String,
}, { timestamps: true });

// ✅ Connection-scoped model factory
const getPurchaseReturnModel = (conn) => {
  if (!conn) {
    return mongoose.models.PurchaseReturn || mongoose.model('PurchaseReturn', purchaseReturnSchema);
  }
  return conn.models.PurchaseReturn || conn.model('PurchaseReturn', purchaseReturnSchema);
};

const forMaster = (conn) => {
  return getPurchaseReturnModel(conn);
};

const forTenant = (conn) => {
  return getPurchaseReturnModel(conn);
};

const PurchaseReturnModel = getPurchaseReturnModel();
PurchaseReturnModel.forMaster = forMaster;
PurchaseReturnModel.forTenant = forTenant;

module.exports = PurchaseReturnModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
