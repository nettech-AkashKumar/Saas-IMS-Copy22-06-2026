const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true, unique: true },

  fullName: { type: String },
  contactNumber: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  profilePicture: { type: String }, // e.g. Cloudinary URL
  bio: { type: String },

}, { timestamps: true });

// ✅ Connection-scoped model factory
const getUserProfileModel = (conn) => {
  if (!conn) {
    return mongoose.models.UserProfile || mongoose.model("UserProfile", UserProfileSchema);
  }
  return conn.models.UserProfile || conn.model("UserProfile", UserProfileSchema);
};

const forMaster = (conn) => {
  return getUserProfileModel(conn);
};

const forTenant = (conn) => {
  return getUserProfileModel(conn);
};

const UserProfileModel = getUserProfileModel();
UserProfileModel.forMaster = forMaster;
UserProfileModel.forTenant = forTenant;

module.exports = UserProfileModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
