const mongoose = require("mongoose");

const salesmanSchema = new mongoose.Schema(
    {
        salesmanName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true },
        brokerId: { type: mongoose.Schema.Types.ObjectId, ref: "Broker", },
        salesmanImage: [{ url: String, public_id: String }],
        isAssigned: { type: Boolean, default: false },
        gstin: { type: String },
        address: { type: String },
        country: { type: String },
        state: { type: String },
        city: { type: String },
        pincode: { type: String },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const getSalesmanModel = (conn) => {
    if (!conn) {
        return mongoose.models.Salesman || mongoose.model("Salesman", salesmanSchema);
    }
    return conn.models.Salesman || conn.model("Salesman", salesmanSchema);
};

const forMaster = (conn) => {
    return getSalesmanModel(conn);
};

const forTenant = (conn) => {
    return getSalesmanModel(conn);
};

const SalesmanModel = getSalesmanModel();
SalesmanModel.forMaster = forMaster;
SalesmanModel.forTenant = forTenant;

module.exports = SalesmanModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
