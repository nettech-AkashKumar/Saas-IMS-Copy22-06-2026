const mongoose = require("mongoose");

const brokerSchema = new mongoose.Schema(
    {
        brokerName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String },
        assignSalesman: [{ type: mongoose.Schema.Types.ObjectId, ref: "Salesman", }],
        brokerImage: [{ url: String, public_id: String, },],
        comissionType: { type: String, required: true },
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

const getBrokerModel = (conn) => {
    if (!conn) {
        return mongoose.models.Broker || mongoose.model("Broker", brokerSchema);
    }
    return conn.models.Broker || conn.model("Broker", brokerSchema);
};

const forMaster = (conn) => {
    return getBrokerModel(conn);
};

const forTenant = (conn) => {
    return getBrokerModel(conn);
};

const BrokerModel = getBrokerModel();
BrokerModel.forMaster = forMaster;
BrokerModel.forTenant = forTenant;

module.exports = BrokerModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
