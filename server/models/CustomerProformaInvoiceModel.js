const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
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
}, { _id: false });

const proformaInvoiceSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerQuotation" },
  proformaNo: { type: String, required: true, unique: true },
  proformaDate: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  items: [itemSchema],
  billingAddress: { type: String },
  shippingAddress: { type: String },
  bankDetails: {
    bankName: String,
    accountHolderName: String,
    accountNumber: String,
    ifsc: String,
    branch: String,
    upiId: String,
    qrCode: String,
  },
  subtotal: { type: Number, required: true, min: 0 },
  totalTax: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  additionalDiscount: {
    pct: { type: Number, default: 0 },
    amt: { type: Number, default: 0 },
  },
  additionalCharges: { type: Number, default: 0 },
  additionalChargesDetails: {
    shipping: { type: Number, default: 0 },
    handling: { type: Number, default: 0 },
    packing: { type: Number, default: 0 },
    service: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  grandTotal: { type: Number, required: true, min: 0 },
  paymentTerms: { type: String, default: "100% advance" },
  advanceAmount: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  advancePaymentStatus: { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
  dueAmount: { type: Number, default: 0 },
  autoRoundOff: { type: Boolean, default: false },
  roundOffValue: { type: Number, default: 0 },
  taxSettings: {
    enableGSTBilling: { type: Boolean, default: true },
    priceIncludeGST: { type: Boolean, default: true },
    autoRoundOff: { type: String, enum: ["0", "1", "5", "10"], default: "0" },
    defaultGSTRate: { type: String, default: "18" }
  },
  status: {
    type: String,
    enum: ["draft", "sent", "accepted", "advance_paid", "fully_paid", "converted_to_order", "converted_to_invoice", "expired", "cancelled"],
    default: "draft"
  },
  convertedToSalesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder" },
  convertedToInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerInvoice" },
  attachments: [{
    url: { type: String },
    public_id: { type: String },
    filename: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  }],
  notes: { type: String },
  termsAndConditions: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
}, { timestamps: true });

proformaInvoiceSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  this.totalTax = this.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  
  const itemsDiscount = this.items.reduce((sum, item) => sum + (item.discountAmt || 0), 0);
  let additionalDiscountValue = 0;
  if (this.additionalDiscount) {
    if (this.additionalDiscount.pct > 0) {
      additionalDiscountValue = (this.subtotal * this.additionalDiscount.pct) / 100;
    } else if (this.additionalDiscount.amt > 0) {
      additionalDiscountValue = this.additionalDiscount.amt;
    }
  }
  this.totalDiscount = itemsDiscount + additionalDiscountValue;
  
  const charges = this.additionalChargesDetails || {};
  this.additionalCharges = (charges.shipping || 0) + (charges.handling || 0) + (charges.packing || 0) + (charges.service || 0) + (charges.other || 0);
  
  let totalBeforeRound = this.subtotal + this.totalTax + this.additionalCharges - this.totalDiscount;
  
  if (this.autoRoundOff) {
    this.roundOffValue = Math.round(totalBeforeRound) - totalBeforeRound;
    this.grandTotal = Math.max(0, Math.round(totalBeforeRound));
  } else {
    this.roundOffValue = 0;
    this.grandTotal = Math.max(0, totalBeforeRound);
  }
   // ✅ ADD THIS: Calculate due amount
  const paidAmt = parseFloat(this.advancePaid) || 0;
  this.dueAmount = this.grandTotal - paidAmt;
  // ✅ ADD THIS: Update advance payment status
  const advanceAmt = parseFloat(this.advanceAmount) || 0;
  if (advanceAmt > 0) {
    if (paidAmt >= advanceAmt) {
      this.advancePaymentStatus = "paid";
    } else if (paidAmt > 0) {
      this.advancePaymentStatus = "partial";
    } else {
      this.advancePaymentStatus = "pending";
    }
  } else {
    this.advancePaymentStatus = "pending";
  }
};

// ✅ Function to get the model for a connection (same as CustomerInvoiceModel)
const getCustomerProformaInvoiceModel = (conn) => {
  return conn.models.CustomerProformaInvoice || conn.model("CustomerProformaInvoice", proformaInvoiceSchema);
};

// ✅ Define forMaster and forTenant as functions
const forMaster = (conn) => getCustomerProformaInvoiceModel(conn);
const forTenant = (conn) => getCustomerProformaInvoiceModel(conn);

// ✅ Export exactly like CustomerInvoiceModel
module.exports = {
  forMaster,
  forTenant,
  getCustomerProformaInvoiceModel,
};