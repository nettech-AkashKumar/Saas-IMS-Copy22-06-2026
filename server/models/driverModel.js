const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
    {
        driverName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        licenceNumber: { type: String, required: true },
        vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", },
        licenceExpiry: { type: String, },
        joiningDate: { type: String, },
        transporterId: { type: mongoose.Schema.Types.ObjectId, ref: "Transporter", },
        advance: { type: Number, },
        creditDay: { type: Number, },
        bankName: { type: String, },
        accountNumber: { type: String, },
        accountHolderName: { type: String, },
        accountType: { type: String, },
        ifscCode: { type: String, },
        branch: { type: String, },
        aadhaarCard: [{ url: String, public_id: String }],
        panCard: [{ url: String, public_id: String }],
        licenseCard: [{ url: String, public_id: String }],
        isAssigned: {
            type: Boolean,
            default: false,
        },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const getDriverModel = (conn) => {
    if (!conn) {
        return mongoose.models.Driver || mongoose.model("Driver", driverSchema);
    }
    return conn.models.Driver || conn.model("Driver", driverSchema);
};

const forMaster = (conn) => {
    return getDriverModel(conn);
};

const forTenant = (conn) => {
    return getDriverModel(conn);
};

const DriverModel = getDriverModel();
DriverModel.forMaster = forMaster;
DriverModel.forTenant = forTenant;

module.exports = DriverModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
