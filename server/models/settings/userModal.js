const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String },
    isActive: {
      type: Boolean,
      default: true,
    },
    twoFactorEnabled: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires:{type:Date},
  },
  {
    timestamps: true,
    collection: "users",
  }
);

const userModel = mongoose.model("users", userSchema);

// ✅ Connection-scoped model factory
const getUserModel = (conn) => {
  if (!conn) {
    return mongoose.models.users || mongoose.model("users", userSchema);
  }
  return conn.models.users || conn.model("users", userSchema);
};

const forMaster = (conn) => {
  return getUserModel(conn);
};

const forTenant = (conn) => {
  return getUserModel(conn);
};

const UserModelExport = getUserModel();
UserModelExport.forMaster = forMaster;
UserModelExport.forTenant = forTenant;

module.exports = UserModelExport;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
