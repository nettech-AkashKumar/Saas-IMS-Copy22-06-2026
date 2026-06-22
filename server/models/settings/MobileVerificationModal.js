const mongoose = require("mongoose")

const mobileOtpSchema = new mongoose.Schema({
    mobile: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt:{type:Date, required:true}
},
{ timestamps: true }
)

const MobileVerificationModal = mongoose.model("MobileverifyOtpsecurity", mobileOtpSchema);

// ✅ Connection-scoped model factory
const getMobileVerificationModel = (conn) => {
  if (!conn) {
    return mongoose.models.MobileverifyOtpsecurity || mongoose.model("MobileverifyOtpsecurity", mobileOtpSchema);
  }
  return conn.models.MobileverifyOtpsecurity || conn.model("MobileverifyOtpsecurity", mobileOtpSchema);
};

const forMaster = (conn) => {
  return getMobileVerificationModel(conn);
};

const forTenant = (conn) => {
  return getMobileVerificationModel(conn);
};

const MobileVerificationModelExport = getMobileVerificationModel();
MobileVerificationModelExport.forMaster = forMaster;
MobileVerificationModelExport.forTenant = forTenant;

module.exports = MobileVerificationModelExport;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;