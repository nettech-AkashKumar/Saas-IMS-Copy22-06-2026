const mongoose = require("mongoose");

const AddTransporterSchema = new mongoose.Schema(
  {
    transporterName: { type: String, unique: true },
    ownerName: { type: String },
    transporterGST: { type: String },
    transporterID: { type: String,unique: true },
    assignDriverID: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
      },
    ],
    assignVehicleID: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
      },
    ],
    bankName: { type: String },
    accountNumber: { type: String },
    accountHolderName: { type: String },
    accountType: { type: String },
    ifscCode: { type: String },
    branchName: { type: String },
    doc1: [
      {
        url: String,
        public_id: String,
      },
    ],
    doc2: [
      {
        url: String,
        public_id: String,
      },
    ],
    doc3: [
      {
        url: String,
        public_id: String,
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)
// ✅ Connection-scoped model factory
const getAddTransporterSchema = (conn) => {
  if (!conn) {
    return mongoose.models.Transporter || mongoose.model("Transporter", AddTransporterSchema);
  }
  return conn.models.Transporter || conn.model("Transporter", AddTransporterSchema);
};

const forMaster = (conn) => {
  return getAddTransporterSchema(conn);
};

const forTenant = (conn) => {
  return getAddTransporterSchema(conn);
};

const Transporter = getAddTransporterSchema();
Transporter.forMaster = forMaster;
Transporter.forTenant = forTenant;

module.exports = Transporter;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
