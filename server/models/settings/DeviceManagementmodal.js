const mongoose = require("mongoose")

const deviceSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "userprofile", required: true },
    device: String,
    ipAddress: String,
    location: String,
    latitude: { type: Number },
    longitude: { type: Number },
    loginTime: { type: Date, default: Date.now }
    
}, {
    timestamps: true
});

// ✅ Connection-scoped model factory
const getDeviceSessionModel = (conn) => {
  if (!conn) {
    return mongoose.models.DeviceSession || mongoose.model("DeviceSession", deviceSessionSchema);
  }
  return conn.models.DeviceSession || conn.model("DeviceSession", deviceSessionSchema);
};

const forMaster = (conn) => {
  return getDeviceSessionModel(conn);
};

const forTenant = (conn) => {
  return getDeviceSessionModel(conn);
};

const DeviceSessionModel = getDeviceSessionModel();
DeviceSessionModel.forMaster = forMaster;
DeviceSessionModel.forTenant = forTenant;

module.exports = DeviceSessionModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;