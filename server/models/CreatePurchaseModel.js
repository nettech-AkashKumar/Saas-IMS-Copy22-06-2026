const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    itemName: { type: String, required: true },
    hsn: { type: String },
    qty: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    taxType: { type: String, required: true },
    taxRate: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    discountPct: { type: Number, default: 0 },
    discountAmt: { type: Number, default: 0 },
    amount: { type: Number, required: true, min: 0 },
    images: [
      {
        url: String,
        public_id: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // ===== TRACKING FIELDS (Matching GRN) =====
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isNewProduct: { type: Boolean, default: false },
    newProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    lotNumber: { type: String, default: "" },
    modelNo: { type: String, default: "" },
    serialno: { type: String, default: "" },
    selectedSerialNos: [{ type: String }],
    selectedColor: { type: String, default: "" },
    selectedSize: { type: String, default: "" },
    expiryDate: { type: Date, default: null },
    manufacturingDate: { type: Date, default: null },
    // Warranty fields
    warrantyType: { type: String, default: "" },
    warrantyPeriod: { type: Number, default: null },
    coverageScope: { type: String, default: "" },
    serviceMode: { type: String, default: "" },
    maxClaimsAllowed: { type: Number, default: null },
    inspectionRequired: { type: Boolean, default: false },
    warrantyStartsFrom: { type: String, default: "" },
    linkedto: { type: String, default: "" },
    extensionPeriod: { type: String, default: "" },
    coverageType: { type: String, default: "" },
    extendedWarrantyPrice: { type: Number, default: null },
    lifetimeDefination: { type: String, default: "" },
    coverageOf: { type: String, default: "" },
    whatNotCovered: { type: String, default: "" },
    maxClaims: { type: Number, default: null },
    replacementOnceOnly: { type: Boolean, default: false },
    // Audit trail
    isNewVariant: { type: Boolean, default: false },
    trackingChangedFields: [{ type: String }],
  },
  { _id: false }
);

const createPurchaseOrderSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    purchaseNo: {
      type: String,
      required: true,
      unique: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    referenceNo: {
      type: String,
      trim: true,
      default: "",
    },
    receiptDate: {
      type: Date,
      default: null,
    },
    items: [itemSchema],

    billingAddress: { type: String },
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
      default: 0,
    },
    additionalChargesDetails: {
      shipping: { type: Number, default: 0 },
      handling: { type: Number, default: 0 },
      packing: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    autoRoundOff: { type: Boolean, default: false },
    roundOffValue: { type: Number, default: 0 },

    grandTotal: { type: Number, required: true, min: 0 },

    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    fullyReceived: { type: Boolean, default: false },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer", "credit", "multiple"],
      default: "cash",
    },

    paymentHistory: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        method: { type: String, required: true },
        reference: { type: String },
        notes: { type: String },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
      },
    ],

    status: {
      type: String,
      enum: ["draft", "converted",  "received", "partial", "cancelled", "overdue"],
      default: "converted",
    },

    attachments: [
      {
        url: { type: String },
        public_id: { type: String },
        filename: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    notes: { type: String },
    termsAndConditions: { type: String },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  { timestamps: true }
);

// Virtuals
createPurchaseOrderSchema.virtual("formattedDate").get(function () {
  return this.purchaseDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
});

createPurchaseOrderSchema.virtual("formattedDueDate").get(function () {
  return this.dueDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
});

// Indexes
createPurchaseOrderSchema.index({ supplierId: 1, status: 1 });
createPurchaseOrderSchema.index({ purchaseDate: -1 });
createPurchaseOrderSchema.index({ createdBy: 1 });

// Pre-save middleware
createPurchaseOrderSchema.pre("save", function (next) {
  if (this.dueDate < this.purchaseDate) {
    this.dueDate = new Date(this.purchaseDate);
    this.dueDate.setDate(this.dueDate.getDate() + 30); // Default 30 days for suppliers
  }
  // For new documents that aren't approved/received, don't set due amount
  // if (this.isNew && this.status === "converted") {
  //   this.dueAmount = 0;
  // }
  next();
});

// Method to calculate totals
// createPurchaseOrderSchema.methods.calculateTotals = function () {
//   // Calculate subtotal from items
//   this.subtotal = this.items.reduce((sum, item) => {
//     return sum + item.qty * item.unitPrice;
//   }, 0);

//   // Calculate total tax
//   this.totalTax = this.items.reduce((sum, item) => {
//     return sum + (item.taxAmount || 0);
//   }, 0);

//   // Calculate items discount
//   const itemsDiscount = this.items.reduce((sum, item) => {
//     return sum + (item.discountAmt || 0);
//   }, 0);
//   // Only calculate due amount for approved/received orders
//   if (this.status === "received" || this.status === "partial") {
//     this.dueAmount = Math.max(0, this.grandTotal - (this.paidAmount || 0));
//   } else {
//     // For pending/converted orders, due amount should be 0
//     this.dueAmount = 0;
//   }
//   this.advanceAmount = Math.max(0, (this.paidAmount || 0) - this.grandTotal);

//   // Calculate additional discount
//   let additionalDiscountValue = 0;
//   if (this.additionalDiscount) {
//     if (this.additionalDiscount.pct > 0) {
//       additionalDiscountValue =
//         (this.subtotal * this.additionalDiscount.pct) / 100;
//     } else if (this.additionalDiscount.amt > 0) {
//       additionalDiscountValue = this.additionalDiscount.amt;
//     }
//   }

//   this.totalDiscount = itemsDiscount + additionalDiscountValue;

//   // Calculate additional charges
//   const additionalChargesDetails = this.additionalChargesDetails || {};
//   const {
//     shipping = 0,
//     handling = 0,
//     packing = 0,
//     service = 0,
//     other = 0,
//   } = additionalChargesDetails;
//   this.additionalCharges = shipping + handling + packing + service + other;

//   // Calculate grand total
//   let grandTotalBefore =
//     this.subtotal + this.totalTax + this.additionalCharges - this.totalDiscount;

//   // Apply round off if enabled
//   if (this.autoRoundOff) {
//     this.roundOffValue = Math.round(grandTotalBefore) - grandTotalBefore;
//     this.grandTotal = Math.max(0, Math.round(grandTotalBefore));
//   } else {
//     this.roundOffValue = 0;
//     this.grandTotal = Math.max(0, grandTotalBefore);
//   }

//   // Calculate payment amounts
//   this.dueAmount = Math.max(0, this.grandTotal - (this.paidAmount || 0));
//   this.advanceAmount = Math.max(0, (this.paidAmount || 0) - this.grandTotal);

//   // Update status based on payment
//   // 🔐 Only auto-update payment-related statuses
//   const finalizedStatus = ["converted", "received", "cancelled"];
//   if(!finalizedStatus.includes(this.status)) {
//   if (this.fullyReceived || (this.paidAmount || 0) >= this.grandTotal) {
//     this.status = "received";
//   } else if ((this.paidAmount || 0) > 0) {
//     this.status = "partial";
//   }

//   if (this.dueAmount > 0 && new Date() > this.dueDate) {
//     this.status = "overdue";
//   }
// }
// };

// Method to calculate totals
createPurchaseOrderSchema.methods.calculateTotals = function () {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + item.qty * item.unitPrice;
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
      additionalDiscountValue =
        (this.subtotal * this.additionalDiscount.pct) / 100;
    } else if (this.additionalDiscount.amt > 0) {
      additionalDiscountValue = this.additionalDiscount.amt;
    }
  }

  this.totalDiscount = itemsDiscount + additionalDiscountValue;

  // Calculate additional charges
  const additionalChargesDetails = this.additionalChargesDetails || {};
  const {
    shipping = 0,
    handling = 0,
    packing = 0,
    service = 0,
    other = 0,
  } = additionalChargesDetails;
  this.additionalCharges = shipping + handling + packing + service + other;

  // Calculate grand total
  let grandTotalBefore =
    this.subtotal + this.totalTax + this.additionalCharges - this.totalDiscount;

  // Apply round off if enabled
  if (this.autoRoundOff) {
    this.roundOffValue = Math.round(grandTotalBefore) - grandTotalBefore;
    this.grandTotal = Math.max(0, Math.round(grandTotalBefore));
  } else {
    this.roundOffValue = 0;
    this.grandTotal = Math.max(0, grandTotalBefore);
  }

  // Calculate payment amounts based on status
  if (this.status === "cancelled") {
    // For rejected orders, no amounts are due
    this.dueAmount = 0;
    this.advanceAmount = 0;
    this.paidAmount = 0; // Reset paid amount for rejected orders
  } else if (this.status === "received" || this.status === "partial") {
    // For approved orders, calculate due normally
    this.dueAmount = Math.max(0, this.grandTotal - (this.paidAmount || 0));
    this.advanceAmount = Math.max(0, (this.paidAmount || 0) - this.grandTotal);
  } else {
    // For pending orders (converted), due amount is 0
    this.dueAmount = 0;
    this.advanceAmount = Math.max(0, (this.paidAmount || 0) - this.grandTotal);
  }
};
const getCreatePurchaseOrderModel = (conn) => {
  return conn.models.CreatePurchase || conn.model("CreatePurchase", createPurchaseOrderSchema);
};

const forMaster = (conn) => getCreatePurchaseOrderModel(conn);
const forTenant = (conn) => getCreatePurchaseOrderModel(conn);

module.exports = {
  forMaster,
  forTenant,
  getCreatePurchaseOrderModel,
};
