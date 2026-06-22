const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    addressLine: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
  },
  { _id: false }
);

const BankSchema = new mongoose.Schema(
  {
    bankName: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
    branch: { type: String },
  },
  { _id: false }
);

const SupplierSchema = new mongoose.Schema(
  {
    supplierCode: { type: String, unique: true },

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    businessType: {
      type: String,
      required: true,
      enum: ["Manufacturer", "Distributor", "Wholesaler"],
    },

    gstin: { type: String },
    phone: { type: String, required: true },
    email: { type: String },

    categoryBrand: { type: String },

    address: AddressSchema,
    bank: BankSchema,

    // for purchase
    totalInvoices: {
      type: Number,
      default: 0,
    },
    totalPurchaseAmount: {
      type: Number,
      default: 0,
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
    },
    totalDueAmount: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
    },
    lastInvoiceDate: {
      type: Date,
    },
    firstInvoiceDate: {
      type: Date,
    },
    lastPurchaseAmount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Connection-scoped model factory
const getSupplierModel = (conn) => {
  if (!conn) {
    return mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);
  }
  return conn.models.Supplier || conn.model("Supplier", SupplierSchema);
};

const forMaster = (conn) => {
  return getSupplierModel(conn);
};

const forTenant = (conn) => {
  return getSupplierModel(conn);
};

const SupplierModel = getSupplierModel();
SupplierModel.forMaster = forMaster;
SupplierModel.forTenant = forTenant;

module.exports = SupplierModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
