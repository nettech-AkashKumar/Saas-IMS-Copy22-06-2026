const mongoose = require("mongoose")

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true }
},
{ timestamps: true }
);

// ✅ Connection-scoped model factory
const getEmailVerifyOtpSecurityModel = (conn) => {
  if (!conn) {
    return mongoose.models.emailverifyotpsecurity || mongoose.model("emailverifyotpsecurity", otpSchema);
  }
  return conn.models.emailverifyotpsecurity || conn.model("emailverifyotpsecurity", otpSchema);
};

const forMaster = (conn) => {
  return getEmailVerifyOtpSecurityModel(conn);
};

const forTenant = (conn) => {
  return getEmailVerifyOtpSecurityModel(conn);
};

const EmailVerifyOtpSecurityModel = getEmailVerifyOtpSecurityModel();
EmailVerifyOtpSecurityModel.forMaster = forMaster;
EmailVerifyOtpSecurityModel.forTenant = forTenant;

module.exports = EmailVerifyOtpSecurityModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;