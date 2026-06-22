// models/Otp.js
// const mongoose = require('mongoose');

// const otpSchema = new mongoose.Schema({
//   email: { type: String, required: true },
//   otp: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now, expires: 1800 } // Expires in 30 mins
// });

// module.exports = mongoose.model('Otp', otpSchema);

// =====================
//  💀 New Code       //--------------------------------------------------------------------------------------------
// =====================

const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
      index: true,
    },

    // OTP stage
    otp: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    retryCount: { type: Number, default: 0 },
    blockedUntil: { type: Date, default: null },

    // 🔐 RESET SESSION (FINAL STAGE)
    resetSessionHash: { type: String, default: null, index: true },
    resetSessionExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

otpSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { otp: { $ne: null } },
  }
);

otpSchema.index(
  { resetSessionExpires: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { resetSessionHash: { $ne: null } },
  }
);

// ✅ Connection-scoped model factory
const getOtpModel = (conn) => {
  if (!conn) {
    return mongoose.models.Otp || mongoose.model("Otp", otpSchema);
  }
  return conn.models.Otp || conn.model("Otp", otpSchema);
};

const forMaster = (conn) => {
  return getOtpModel(conn);
};

const forTenant = (conn) => {
  return getOtpModel(conn);
};

const OtpModel = getOtpModel();
OtpModel.forMaster = forMaster;
OtpModel.forTenant = forTenant;

module.exports = OtpModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;