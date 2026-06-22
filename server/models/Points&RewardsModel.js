const mongoose = require('mongoose');

const RewardSystemSchema = new mongoose.Schema({
  rewardType: {
    type: String,
    required: true,
    enum: ['Shopping Points', 'Cashback', 'Referral', 'Tiered'],
  },
  offerName: { type: String, trim: true },
  amountForPoint: { type: Number },
  minPurchase: { type: Number },
  deadline: { type: Date },
  pointValue: { type: Number },
  maxEligibleAmount: { type: Number },
  minInvoiceValue: { type: Number },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
  },
  // createdBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   // required: true,  // comment out if no auth yet
  // },
  createdAt: { type: Date, default: Date.now },
  shareLink: { type: String },
  isDelete: { type: Boolean, default: false },
});

RewardSystemSchema.pre('save', function (next) {
  if (this.isNew && !this.shareLink) {
    this.shareLink = `https://yourapp.com/rewards/${this._id}`;
  }
  next();
});

// ✅ Connection-scoped model factory
const getRewardSystemModel = (conn) => {
  if (!conn) {
    return mongoose.models.RewardSystem || mongoose.model('RewardSystem', RewardSystemSchema);
  }
  return conn.models.RewardSystem || conn.model('RewardSystem', RewardSystemSchema);
};

const forMaster = (conn) => {
  return getRewardSystemModel(conn);
};

const forTenant = (conn) => {
  return getRewardSystemModel(conn);
};

const RewardSystemModel = getRewardSystemModel();
RewardSystemModel.forMaster = forMaster;
RewardSystemModel.forTenant = forTenant;

module.exports = RewardSystemModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
