// models/SalesOrder.js - Simplified version
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    itemName: { type: String, required: true },
    hsnCode: { type: String },
    description: { type: String },
    lotNumber: { type: String },
    selectedSerialNos: [{ type: String }],
    selectedColor: { type: String },
    selectedSize: { type: String },
    qty: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    taxType: { type: String, required: true },
    taxRate: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    discountPct: { type: Number, default: 0 },
    discountAmt: { type: Number, default: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const salesOrderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    salesOrderNo: { type: String, required: true, unique: true },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    items: [itemSchema],
    billingAddress: { type: String },
    shippingAddress: { type: String },
    subtotal: { type: Number, required: true, min: 0 },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    additionalDiscount: { pct: { type: Number, default: 0 }, amt: { type: Number, default: 0 } },
    additionalCharges: { type: Number, default: 0 },
    additionalChargesDetails: {
      shipping: { type: Number, default: 0 },
      handling: { type: Number, default: 0 },
      packing: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    grandTotal: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    advancePaymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },
    sourceProformaId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerProformaInvoice", default: null },
    status: {
      type: String,
      enum: ["draft", "confirmed", "processing", "completed", "cancelled", "converted_to_invoice"],
      default: "draft",
    },
      attachments: [{
    url: { type: String },
    public_id: { type: String },
    filename: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  }],
    notes: { type: String },
    termsAndConditions: { type: String },
    sourceQuotationId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerQuotation", default: null },
    sourceProformaId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerProformaInvoice", default: null },
    convertedToInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerInvoice", default: null },
    convertedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  },
  { timestamps: true },
);

// Generate order number
salesOrderSchema.statics.generateOrderNo = async function (CounterModel) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const counterKey = `SO${year}${month}`;
  const counter = await CounterModel.findByIdAndUpdate(counterKey, { $inc: { seq: 1 } }, { upsert: true, new: true });
  const sequence = String(counter.seq).padStart(3, "0");
  return `${counterKey}${sequence}`;
};

// Calculate totals
salesOrderSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  this.totalTax = this.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);

  const itemsDiscount = this.items.reduce((sum, item) => sum + (item.discountAmt || 0), 0);
  const additionalDiscountValue = this.additionalDiscount?.pct ? (this.subtotal * this.additionalDiscount.pct) / 100 : (this.additionalDiscount?.amt || 0);
  this.totalDiscount = itemsDiscount + additionalDiscountValue;

  const charges = this.additionalChargesDetails || {};
  this.additionalCharges = (charges.shipping || 0) + (charges.handling || 0) + (charges.packing || 0) + (charges.service || 0) + (charges.other || 0);

  this.grandTotal = Math.max(0, this.subtotal + this.totalTax + this.additionalCharges - this.totalDiscount);
};

const getSalesOrderModel = (conn) => {
  if (!conn) return mongoose.models.SalesOrder || mongoose.model("SalesOrder", salesOrderSchema);
  return conn.models.SalesOrder || conn.model("SalesOrder", salesOrderSchema);
};

const SalesOrder = getSalesOrderModel();
SalesOrder.forMaster = (conn) => getSalesOrderModel(conn);
SalesOrder.forTenant = (conn) => getSalesOrderModel(conn);

module.exports = SalesOrder;
module.exports.forMaster = SalesOrder.forMaster;
module.exports.forTenant = SalesOrder.forTenant;