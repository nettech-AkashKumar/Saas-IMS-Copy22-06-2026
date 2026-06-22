const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    quantityChanged: {
        type: Number,
        required: true,
    },
    priceChanged: {
        type: Number,
    },
  quantityReturned: {
    type: Number, // ✅ This stores return quantity
  },

    type: {
        type: String,
        enum: ['purchase', 'sale', 'return', 'adjustment', 'purchase-update'], // valid values only

        required: true,
    },
    notes: {
        type: String,
    },
});

// ✅ Connection-scoped model factory
const getStockHistoryModel = (conn) => {
  if (!conn) {
    return mongoose.models.StockHistory || mongoose.model('StockHistory', stockHistorySchema);
  }
  return conn.models.StockHistory || conn.model('StockHistory', stockHistorySchema);
};

const forMaster = (conn) => {
  return getStockHistoryModel(conn);
};

const forTenant = (conn) => {
  return getStockHistoryModel(conn);
};

const StockHistoryModel = getStockHistoryModel();
StockHistoryModel.forMaster = forMaster;
StockHistoryModel.forTenant = forTenant;

module.exports = StockHistoryModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;



// const mongoose = require('mongoose');

// const stockHistorySchema = new mongoose.Schema({
//     product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
//     date: { type: Date, default: Date.now },
//     quantityChanged: Number,
//     type: { type: String, enum: ['purchase', 'sale', 'adjustment'] },
//     notes: String,
// });

// module.exports = mongoose.model('StockHistory', stockHistorySchema);
