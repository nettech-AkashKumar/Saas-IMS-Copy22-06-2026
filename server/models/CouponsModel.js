const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  name: { type: String, },
  code: { type: String,unique: true },
  type: { type: String, enum: ['percentage', 'flat'],},
  discount: { type: String, required: true },
  limit: { type: Number, default: 0 },
  valid:{type: Date, default: Date.now},
  validStatus:{type: String},
  oncePerCustomer: { type: Boolean, default: false },
  description: { type: String },
  status: { type: Boolean, default: true }
}, { timestamps: true });

// ✅ Connection-scoped model factory
const getCouponModel = (conn) => {
  if (!conn) {
    return mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
  }
  return conn.models.Coupon || conn.model('Coupon', couponSchema);
};

const forMaster = (conn) => {
  return getCouponModel(conn);
};

const forTenant = (conn) => {
  return getCouponModel(conn);
};

const CouponModel = getCouponModel();
CouponModel.forMaster = forMaster;
CouponModel.forTenant = forTenant;

module.exports = CouponModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;