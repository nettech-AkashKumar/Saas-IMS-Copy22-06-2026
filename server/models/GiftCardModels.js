const mongoose = require("mongoose");

const GiftcardSchema = new mongoose.Schema({
    giftCard: {
        type: String,
        required: true,
    },
    customer: {
        type: String,
        required: true,
    },
    issuedDate: {
        type: Date,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    balance: {
        type: Number,
    },
    status: {
        type: Boolean,
        required: true,
    }

},
{
    timestamps :true ,
});

// ✅ Connection-scoped model factory
const getGiftCardModel = (conn) => {
  if (!conn) {
    return mongoose.models.GiftCard || mongoose.model('GiftCard', GiftcardSchema);
  }
  return conn.models.GiftCard || conn.model('GiftCard', GiftcardSchema);
};

const forMaster = (conn) => {
  return getGiftCardModel(conn);
};

const forTenant = (conn) => {
  return getGiftCardModel(conn);
};

const GiftCardModel = getGiftCardModel();
GiftCardModel.forMaster = forMaster;
GiftCardModel.forTenant = forTenant;

module.exports = GiftCardModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;


