const mongoose = require("mongoose");

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    itemName: { type: String, required: true },
    hsnCode: { type: String, default: "" },
    description: { type: String, default: "" },
    lotNumber: { type: String, default: "" },
    selectedSerialNos: [{ type: String }],
    selectedColor: { type: String, default: "" },
    selectedSize: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    taxType: { type: String, default: "GST 0%" },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountPct: { type: Number, default: 0 },
    discountAmt: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    previousReceivedQty: { type: Number, default: 0 }, // Track received quantity for GRN
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    purchaseNo: {
      type: String,
      required: true,
      unique: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
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
    items: [purchaseOrderItemSchema],
    billingAddress: { type: String, default: "" },
    shippingAddress: { type: String, default: "" },

    // Financial fields
    subtotal: { type: Number, default: 0 },
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
    autoRoundOff: { type: Boolean, default: false },
    roundOffValue: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    // Payment fields
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

    // Status fields
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled", "partial_received"],
      default: "pending",
    },

    // GRN tracking
    grnHistory: [
      {
        grnId: { type: mongoose.Schema.Types.ObjectId, ref: "GRN" },
        receivedDate: { type: Date },
        itemsReceived: [
          {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            receivedQty: { type: Number },
          },
        ],
      },
    ],

    // Attachments
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
    termsAndConditions: { type: String, default: "" },

    // Soft delete
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

// Virtual for total ordered quantity
purchaseOrderSchema.virtual("totalOrderedQty").get(function () {
  return this.items.reduce((sum, item) => sum + (item.qty || 0), 0);
});

// Virtual for total received quantity
purchaseOrderSchema.virtual("totalReceivedQty").get(function () {
  return this.items.reduce((sum, item) => sum + (item.previousReceivedQty || 0), 0);
});

// Virtual for remaining quantity
purchaseOrderSchema.virtual("remainingQty").get(function () {
  return this.items.reduce((sum, item) => sum + ((item.qty || 0) - (item.previousReceivedQty || 0)), 0);
});

// Method to check if fully received
purchaseOrderSchema.methods.isFullyReceived = function () {
  return this.items.every(item => (item.previousReceivedQty || 0) >= item.qty);
};

// Method to get receiving status
purchaseOrderSchema.methods.getReceivingStatus = function () {
  const totalOrdered = this.totalOrderedQty;
  const totalReceived = this.totalReceivedQty;

  if (totalReceived === 0) return "pending";
  if (totalReceived >= totalOrdered) return "full";
  if (totalReceived > totalOrdered) return "over";
  return "partial";
};

// Method to update receiving quantities from GRN
purchaseOrderSchema.methods.updateReceivedQuantities = function (receivedItems) {
  for (const receivedItem of receivedItems) {
    const purchaseItem = this.items.find(
      item => item.productId.toString() === receivedItem.productId
    );
    if (purchaseItem) {
      purchaseItem.previousReceivedQty = (purchaseItem.previousReceivedQty || 0) + receivedItem.receivedQty;
    }
  }
  return this.save();
};

// Method to add GRN to history
purchaseOrderSchema.methods.addGRNHistory = function (grnId, itemsReceived) {
  if (!this.grnHistory) this.grnHistory = [];
  this.grnHistory.push({
    grnId,
    receivedDate: new Date(),
    itemsReceived: itemsReceived.map(item => ({
      productId: item.productId,
      receivedQty: item.receivedQty,
    })),
  });
  return this.save();
};

// Pre-save middleware
purchaseOrderSchema.pre("save", function (next) {
  // Auto-update status based on received quantities
  const totalOrdered = this.totalOrderedQty;
  const totalReceived = this.totalReceivedQty;

  if (this.status !== "cancelled") {
    if (totalReceived >= totalOrdered && totalOrdered > 0) {
      this.status = "approved";
      this.fullyReceived = true;
    } else if (totalReceived > 0) {
      this.status = "partial_received";
    }
  }

  next();
});

// ================= MODEL FACTORY =================
const getPurchaseOrderModel = (conn) => {
  if (!conn) throw new Error("❌ Connection required");

  return (
    conn.models.PurchaseOrder ||
    conn.model("PurchaseOrder", purchaseOrderSchema)
  );
};

module.exports = {
  forTenant: getPurchaseOrderModel,
  forMaster: getPurchaseOrderModel,
};