const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    companyEmail: { type: String },
    companyPhone: { type: String },
    employeeSize: { type: String },
    industry: { type: String },
    gst: { type: String },
    website: { type: String },
    subdomain: { type: String, required: true, unique: true },
    dbName: { type: String, required: true, unique: true },
    plan: { type: String},
    billingCycle: { type: String, default: "monthly", enum: ["monthly", "annually"] },
    planPrice: { type: Number, default: 0 },
    maxEmployees: { type: Number, default: 2 },
    modulePermissions: { type: Object, default: {} },

    // 🔥 IMPORTANT
    isActive: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
    },

    adminEmail: { type: String, required: true, unique: true },
    companyEmail: { type: String, sparse: true, unique: true },

    // OTP fields
    otp: { type: String },
    otpExpiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = (conn) =>
  conn.models.Company || conn.model("Company", CompanySchema);
