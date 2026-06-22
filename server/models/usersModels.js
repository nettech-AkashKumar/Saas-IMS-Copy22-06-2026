const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true }, // Added for new UI
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false, default: "" },
    password: { type: String, required: true },
    plainPassword:{type:String},  //for temporary
    lastLogin: { type: Date }, // Added for new UI
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    // for profile image
    profileImage: {
      url: { type: String },
      public_id: { type: String },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: String },
    resetPasswordOTP: { type: String },
    resetPasswordOTPExpires: { type: Date },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    resetToken: String,
    resetTokenExpire: Date,
    status: {
      type: String,
      enum: ["Active", "Inactive", "Blacklist"], // Updated with Blacklist
      default: "Active",
    },
    // Two Factor authentication
    twoFactorEnabled: { type: Boolean, default: true },
    otp: { type: String },
    otpExpires: { type: Date },

    trustedDevices: [
      {
        deviceId: { type: String },
        deviceInfo: { type: String },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // sessions or refresh tokens - for multi device logout
    refreshTokens: [
      {
        token: { type: String },
        deviceInfo: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resetRequestCount: { type: Number, default: 0 },
    resetRequestWindowStart: { type: Date },
    resetRequestBlockedUntil: { type: Date },
  },
  {
    timestamps: true,
  }
);

// ✅ Keep _id and do NOT convert it to id
usersSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    return ret;
  },
});

// Helper method: check if password changed after JWT issued
usersSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if(this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp
  }
  //false means not changed
  return false;
}

usersSchema.methods.removeToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  await this.save();
};

const getUsersModel = (conn) => {
  // 🚫 STRICT: Never use default connection if conn is required
  if (!conn) {
    throw new Error("❌ Connection object is required to get User model. Cannot use default connection!");
  }

  if (!conn.models || typeof conn.model !== "function") {
    throw new Error("❌ Invalid connection object passed to User model");
  }

  return conn.models.Users || conn.model("Users", usersSchema);
};

const forMaster = (conn) => {
  if (!conn) {
    throw new Error("❌ Master DB connection is required");
  }
  // console.log(`🏗️ Creating User model for master DB: ${conn.name}`);
  const model = getUsersModel(conn);
  // console.log(`✅ User model created for ${conn.name}`);
  return model;
};

const forTenant = (conn) => {
  if (!conn) {
    throw new Error("❌ Tenant DB connection is required");
  }
  // console.log(`🏗️ Creating User model for tenant DB: ${conn.name}`);
  const model = getUsersModel(conn);
  // console.log(`✅ User model created for ${conn.name}`);
  return model;
};

// ✅ Export only connection-scoped factories (no default model)
module.exports = {
  forMaster,
  forTenant,
};

module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
