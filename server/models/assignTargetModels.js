const mongoose = require("mongoose");

const assignTargetSchema = new mongoose.Schema(
    {
        assignToType: {
            type: String,
            enum: ["Broker", "Salesman"],
            required: true,
        },
        assignToTarget: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "assignToType",
            default: null,
            // required: true,
        },
        assignedToName: { type: String },
        selectedSalesman: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Salesman",
            default: null,
        },
        duration: { type: String },
        targetMetric: { type: String },
        targetValue: { type: String },
        items: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        type: { type: String, },
        IncentiveValue: { type: Number, },
    },
    { timestamps: true }
);

const getassignTargetModel = (conn) => {
    if (!conn) {
        return mongoose.models.assignTarget || mongoose.model("assignTarget", assignTargetSchema);
    }
    return conn.models.assignTarget || conn.model("assignTarget", assignTargetSchema);
};

const forMaster = (conn) => {
    return getassignTargetModel(conn);
};

const forTenant = (conn) => {
    return getassignTargetModel(conn);
};

const assignTargetModels = getassignTargetModel();
assignTargetModels.forMaster = forMaster;
assignTargetModels.forTenant = forTenant;

module.exports = assignTargetModels;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
