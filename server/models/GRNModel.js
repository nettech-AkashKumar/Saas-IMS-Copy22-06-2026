const mongoose = require("mongoose");

const grnItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // NEW: which specific variant on that product this receipt was posted against.
    // Critical for accurate stock reversal on delete, and for the frontend to
    // pre-fill "Manage Tracking" with the right variant's data next time.
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isNewProduct: { type: Boolean, default: false },        
    newProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    itemName: { type: String, required: true },
    hsnCode: { type: String, default: "" },
    unit: { type: String, required: true },
    orderedQty: { type: Number, default: 0 },
    previousReceived: { type: Number, default: 0 },
    receivingNow: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, default: 0 },
    receivingPrice: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "partial", "full", "over"],
      default: "pending",
    },
    selectedSerialNos: [{ type: String }],
    selectedColor: { type: String, default: "" },
    selectedSize: { type: String, default: "" },
    lotNumber: { type: String, default: "" },

    // NEW: batch / tracking fields captured from the "Manage Tracking" popup
    modelNo: { type: String, default: "" },
    expiryDate: { type: Date, default: null },
    manufacturingDate: { type: Date, default: null },

    // NEW: warranty fields captured from the "Manage Tracking" -> Warranty popup
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

    // NEW: audit trail — was this receipt forced to create a new variant, and why
    isNewVariant: { type: Boolean, default: false },
    newProductId: {                    // ← ADD THIS
  type: mongoose.Schema.Types.ObjectId,
  ref: "Product",
  default: null,
},
trackingChangedFields: [{ type: String }],
  },
  { _id: false }
);

const grnSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      unique: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    receiveDate: {
      type: Date,
      default: Date.now,
    },
    items: [grnItemSchema],

    // Financial fields
    subtotal: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    additionalChargesDetails: {
      shipping: { type: Number, default: 0 },
      handling: { type: Number, default: 0 },
      packing: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    grandTotal: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
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
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      },
    ],

    attachments: [
      {
        url: { type: String },
        public_id: { type: String },
        filename: { type: String },
        fileType: { type: String },
        fileSize: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    notes: { type: String, default: "" },
     convertedToPurchase: {
      type: Boolean,
      default: false,
    },
    convertedPurchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatePurchase",
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  { timestamps: true }
);

grnSchema.pre("save", async function (next) {
  if (!this.grnNumber || this.grnNumber === "") {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    this.grnNumber = `GRN${year}${month}${day}${random}`;

    const existing = await this.constructor.findOne({ grnNumber: this.grnNumber });
    if (existing) {
      this.grnNumber = `GRN${year}${month}${day}${random}${Date.now().toString().slice(-4)}`;
    }
  }
  next();
});

grnSchema.methods.getReceivingSummary = function () {
  const totalOrdered = this.items.reduce((sum, item) => sum + item.orderedQty, 0);
  const totalReceived = this.items.reduce((sum, item) => sum + item.receivingNow, 0);
  const totalPrevious = this.items.reduce((sum, item) => sum + item.previousReceived, 0);

  let status = "pending";
  if (totalReceived === 0) status = "pending";
  else if (totalReceived + totalPrevious >= totalOrdered) status = "full";
  else if (totalReceived + totalPrevious > totalOrdered) status = "over";
  else status = "partial";

  return {
    totalOrdered,
    totalReceived,
    totalPrevious,
    totalRemaining: totalOrdered - (totalReceived + totalPrevious),
    status,
  };
};

const getGRNModel = (conn) => {
  if (!conn) throw new Error("❌ Connection required");
  return conn.models.GRN || conn.model("GRN", grnSchema);
};

module.exports = {
  forTenant: getGRNModel,
  forMaster: getGRNModel,
};

// const mongoose = require("mongoose");

// const grnItemSchema = new mongoose.Schema(
//   {
//     productId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },
//     itemName: { type: String, required: true },
//     hsnCode: { type: String, default: "" },
//     unit: { type: String, required: true },
//     orderedQty: { type: Number, default: 0 },
//     previousReceived: { type: Number, default: 0 },
//     receivingNow: { type: Number, required: true, min: 0 },
//     unitPrice: { type: Number, default: 0 },
//     receivingPrice: { type: Number, default: 0 },
//     taxRate: { type: Number, default: 0 },
//     taxAmount: { type: Number, default: 0 },
//     amount: { type: Number, default: 0 },
//     status: {
//       type: String,
//       enum: ["pending", "partial", "full", "over"],
//       default: "pending",
//     },
//     selectedSerialNos: [{ type: String }],
//     selectedColor: { type: String, default: "" },
//     selectedSize: { type: String, default: "" },
//     lotNumber: { type: String, default: "" },
//   },
//   { _id: false }
// );

// const grnSchema = new mongoose.Schema(
//   {
//     grnNumber: {
//       type: String,
//       unique: true,
//     },
//     purchaseOrderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "PurchaseOrder",
//       required: true,
//     },
//     supplierId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Supplier",
//       required: true,
//     },
//     receiveDate: {
//       type: Date,
//       default: Date.now,
//     },
//     items: [grnItemSchema],

//     // Financial fields
//     subtotal: { type: Number, default: 0 },
//     totalTax: { type: Number, default: 0 },
//     additionalCharges: { type: Number, default: 0 },
//     additionalChargesDetails: {
//       shipping: { type: Number, default: 0 },
//       handling: { type: Number, default: 0 },
//       packing: { type: Number, default: 0 },
//       service: { type: Number, default: 0 },
//       other: { type: Number, default: 0 },
//     },
//     grandTotal: { type: Number, default: 0 },
//     paidAmount: { type: Number, default: 0 },
//     dueAmount: { type: Number, default: 0 },
//     fullyReceived: { type: Boolean, default: false },
//     paymentMethod: {
//       type: String,
//       enum: ["cash", "card", "upi", "bank_transfer", "credit", "multiple"],
//       default: "cash",
//     },
//     paymentHistory: [
//       {
//         date: { type: Date, default: Date.now },
//         amount: { type: Number, required: true },
//         method: { type: String, required: true },
//         reference: { type: String },
//         notes: { type: String },
//         addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
//       },
//     ],

//     // Attachments
//     attachments: [
//       {
//         url: { type: String },
//         public_id: { type: String },
//         filename: { type: String },
//         fileType: { type: String },
//         fileSize: { type: Number },
//         uploadedAt: { type: Date, default: Date.now },
//       },
//     ],

//     notes: { type: String, default: "" },

//     // Soft delete
//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Users",
//     },
//   },
//   { timestamps: true }
// );

// // Generate GRN number before saving
// grnSchema.pre("save", async function (next) {
//   // Only generate if grnNumber is not already set or is empty
//   if (!this.grnNumber || this.grnNumber === "") {
//     const date = new Date();
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
//     this.grnNumber = `GRN${year}${month}${day}${random}`;
    
//     // Check if this GRN number already exists (to avoid duplicates)
//     const existing = await this.constructor.findOne({ grnNumber: this.grnNumber });
//     if (existing) {
//       // If exists, add a timestamp suffix
//       this.grnNumber = `GRN${year}${month}${day}${random}${Date.now().toString().slice(-4)}`;
//     }
//   }
//   next();
// });

// // Method to get receiving status summary
// grnSchema.methods.getReceivingSummary = function () {
//   const totalOrdered = this.items.reduce((sum, item) => sum + item.orderedQty, 0);
//   const totalReceived = this.items.reduce((sum, item) => sum + item.receivingNow, 0);
//   const totalPrevious = this.items.reduce((sum, item) => sum + item.previousReceived, 0);

//   let status = "pending";
//   if (totalReceived === 0) status = "pending";
//   else if (totalReceived + totalPrevious >= totalOrdered) status = "full";
//   else if (totalReceived + totalPrevious > totalOrdered) status = "over";
//   else status = "partial";

//   return {
//     totalOrdered,
//     totalReceived,
//     totalPrevious,
//     totalRemaining: totalOrdered - (totalReceived + totalPrevious),
//     status,
//   };
// };

// // ================= MODEL FACTORY =================
// const getGRNModel = (conn) => {
//   if (!conn) throw new Error("❌ Connection required");

//   return (
//     conn.models.GRN ||
//     conn.model("GRN", grnSchema)
//   );
// };

// module.exports = {
//   forTenant: getGRNModel,
//   forMaster: getGRNModel,
// };