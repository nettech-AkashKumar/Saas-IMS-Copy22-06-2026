const mongoose = require("mongoose");
const auditLogSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId, ref:"Users", required:true},
    userName:{type: String},
    role:{type: String},
    module: {type: String}, // e.g. "Product", "Purchase", "Sales"
    action: {type: String}, // e.g. "CREATE", "UPDATE", "DELETE", "VIEW"
    description: {type: String}, // e.g. "Added product: Laptop X"
    oldData: { type: Object, default: null }, // optional: store before-change data
    newData:{ type: Object, default: null }, // optional: store after-change data
    ipAddress: { type: String },
    device: { type: String },
    createdAt: { type: Date, default: Date.now },

}, {
    timestamps:true
});

// ✅ Connection-scoped model factory
const getAuditLogModel = (conn) => {
  if (!conn) {
    return mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
  }
  return conn.models.AuditLog || conn.model("AuditLog", auditLogSchema);
};

const forMaster = (conn) => {
  return getAuditLogModel(conn);
};

const forTenant = (conn) => {
  return getAuditLogModel(conn);
};

const AuditLogModel = getAuditLogModel();
AuditLogModel.forMaster = forMaster;
AuditLogModel.forTenant = forTenant;

module.exports = AuditLogModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;