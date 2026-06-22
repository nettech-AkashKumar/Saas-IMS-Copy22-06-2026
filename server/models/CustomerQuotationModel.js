const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    itemName: { type: String, required: true },
    hsnCode: { type: String },
    description: { type: String },  // Add description field
    lotNumber: { type: String },      // Add lot number field
    selectedSerialNos: [{ type: String }], // Array for multiple serial numbers
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
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    quotationNo: {
      type: String,
      required: true,
      // unique: true,
    },
    quotationDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    items: [quotationItemSchema],

    billingAddress: { type: String, required: true },
    shippingAddress: { type: String },

    subtotal: { type: Number, required: true, min: 0 },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },

    additionalDiscount: {
      pct: { type: Number, default: 0 },
      amt: { type: Number, default: 0 },
    },

    additionalCharges: {
      type: Number,
      default: 0
    },
    additionalChargesDetails: {
      shipping: { type: Number, default: 0 },
      handling: { type: Number, default: 0 },
      packing: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    shoppingPointsUsed: { type: Number, default: 0 },
    pointValue: { type: Number, default: 10 },

    autoRoundOff: { type: Boolean, default: false },
    roundOffValue: { type: Number, default: 0 },

    grandTotal: { type: Number, required: true, min: 0 },

    // Quotation specific fields
    validForDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365
    },

    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "expired", "converted", "paid", "partial", "converted_to_proforma", "revised", "active"],
      default: "draft",
    },

    convertedToInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerInvoice",
    },
    convertedAt: { type: Date },

    attachments: [{
      url: { type: String },
      public_id: { type: String },
      filename: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }],

    notes: { type: String },
    termsAndConditions: { type: String },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },

    isLatest: {
      type: Boolean,
      default: true,
      index: true,
    },
    isRevised: {
      type: Boolean,
      default: false,
    },
    originalQuotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerQuotation",
      index: true,
    },
    revisionNumber: {
      type: Number,
      default: 1,
    },
    revisedAt: {
      type: Date,
    },
    revisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  { timestamps: true }
);

// Virtuals
quotationSchema.virtual("formattedDate").get(function () {
  return this.quotationDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
});

quotationSchema.virtual("formattedExpiryDate").get(function () {
  return this.expiryDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
});

quotationSchema.virtual("daysRemaining").get(function () {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes
quotationSchema.index({ customerId: 1, status: 1 });
quotationSchema.index({ quotationDate: -1 });
quotationSchema.index({ createdBy: 1 });
quotationSchema.index({ expiryDate: 1 });
quotationSchema.index({ status: 1, expiryDate: 1 });
quotationSchema.index({ quotationNo: 1, isLatest: 1 });
quotationSchema.index({ quotationNo: 1, createdAt: -1 });
quotationSchema.index({ quotationNo: 1 }, { unique: false });

// Pre-save middleware
quotationSchema.pre("save", function (next) {
  // Set expiry date if not provided
  if (!this.expiryDate) {
    this.expiryDate = new Date(this.quotationDate);
    this.expiryDate.setDate(this.expiryDate.getDate() + (this.validForDays || 30));
  }

  // Set validForDays based on dates
  if (this.quotationDate && this.expiryDate) {
    const diffTime = this.expiryDate - this.quotationDate;
    this.validForDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  next();
});

// Method to calculate totals - SAME AS INVOICE
quotationSchema.methods.calculateTotals = function () {
  // Calculate subtotal from items (qty * unitPrice)
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.qty * item.unitPrice);
  }, 0);

  // Calculate total tax
  this.totalTax = this.items.reduce((sum, item) => {
    return sum + (item.taxAmount || 0);
  }, 0);

  // Calculate items discount
  const itemsDiscount = this.items.reduce((sum, item) => {
    return sum + (item.discountAmt || 0);
  }, 0);

  // Calculate additional discount
  let additionalDiscountValue = 0;
  if (this.additionalDiscount) {
    if (this.additionalDiscount.pct > 0) {
      additionalDiscountValue = (this.subtotal * this.additionalDiscount.pct) / 100;
    } else if (this.additionalDiscount.amt > 0) {
      additionalDiscountValue = this.additionalDiscount.amt;
    }
  }

  this.totalDiscount = itemsDiscount + additionalDiscountValue;

  // Calculate additional charges
  const additionalChargesDetails = this.additionalChargesDetails || {};
  const { shipping = 0, handling = 0, packing = 0, service = 0, other = 0 } = additionalChargesDetails;
  this.additionalCharges = shipping + handling + packing + service + other;

  // Calculate points redeemed amount
  const pointsRedeemedAmount = (this.shoppingPointsUsed || 0) * (this.pointValue || 10);

  // Calculate grand total
  let grandTotalBefore = this.subtotal +
    this.totalTax +
    this.additionalCharges -
    this.totalDiscount -
    pointsRedeemedAmount;

  // Apply round off if enabled
  if (this.autoRoundOff) {
    this.roundOffValue = Math.round(grandTotalBefore) - grandTotalBefore;
    this.grandTotal = Math.max(0, Math.round(grandTotalBefore));
  } else {
    this.roundOffValue = 0;
    this.grandTotal = Math.max(0, grandTotalBefore);
  }
};

// Method to convert quotation to invoice
quotationSchema.methods.convertToInvoice = async function (invoiceNo) {
  const Invoice = mongoose.model("CustomerInvoice");

  const invoiceData = {
    customerId: this.customerId,
    invoiceNo: invoiceNo,
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    items: this.items,
    billingAddress: this.billingAddress,
    shippingAddress: this.shippingAddress || this.billingAddress,
    subtotal: this.subtotal,
    totalTax: this.totalTax,
    totalDiscount: this.totalDiscount,
    additionalDiscount: this.additionalDiscount,
    additionalCharges: this.additionalCharges,
    additionalChargesDetails: this.additionalChargesDetails,
    shoppingPointsUsed: this.shoppingPointsUsed,
    pointValue: this.pointValue,
    autoRoundOff: this.autoRoundOff,
    roundOffValue: this.roundOffValue,
    grandTotal: this.grandTotal,
    status: "draft",
    notes: this.notes,
    termsAndConditions: this.termsAndConditions,
    createdBy: this.createdBy,
  };

  const invoice = new Invoice(invoiceData);
  await invoice.save();

  // Update quotation status
  this.status = "converted";
  this.convertedToInvoice = invoice._id;
  this.convertedAt = new Date();
  await this.save();

  return invoice;
};

// Static method to check and update expired quotations
quotationSchema.statics.updateExpiredQuotations = async function () {
  const now = new Date();

  const result = await this.updateMany(
    {
      status: { $in: ["draft", "sent"] },
      expiryDate: { $lt: now },
      status: { $ne: "expired" }
    },
    {
      $set: { status: "expired" }
    }
  );

  return result;
};

const getCustomerQuotationModel = (conn) => {
  if (!conn) {
    return mongoose.models.CustomerQuotation || mongoose.model("CustomerQuotation", quotationSchema);
  }
  return conn.models.CustomerQuotation || conn.model("CustomerQuotation", quotationSchema);
};

const forMaster = (conn) => {
  return getCustomerQuotationModel(conn);
};

const forTenant = (conn) => {
  return getCustomerQuotationModel(conn);
};

const CustomerQuotationModel = getCustomerQuotationModel();
CustomerQuotationModel.forMaster = forMaster;
CustomerQuotationModel.forTenant = forTenant;

module.exports = CustomerQuotationModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;