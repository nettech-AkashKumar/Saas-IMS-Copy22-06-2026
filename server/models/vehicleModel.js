const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
    {
        vehicleType: { type: String, required: true },
        vehicleNumber: { type: String, required: true },
        capacity: { type: Number, },
        insuranceExpiry: { type: Date, },
        lastServiceDate: { type: Date, },
        assignDriver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", },
        assignTransporter: { type: mongoose.Schema.Types.ObjectId, ref: "Transporter", },
        vehicleImage: [{ url: String, public_id: String, },],
        polutionPaper: [{ url: String, public_id: String, },],
        ownerCard: [{ url: String, public_id: String, },],
        isAssigned: {
            type: Boolean,
            default: false,
        },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const getVehicleModel = (conn) => {
    if (!conn) {
        return mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
    }
    return conn.models.Vehicle || conn.model("Vehicle", vehicleSchema);
};

const forMaster = (conn) => {
    return getVehicleModel(conn);
};

const forTenant = (conn) => {
    return getVehicleModel(conn);
};

const VehicleModel = getVehicleModel();
VehicleModel.forMaster = forMaster;
VehicleModel.forTenant = forTenant;

module.exports = VehicleModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
