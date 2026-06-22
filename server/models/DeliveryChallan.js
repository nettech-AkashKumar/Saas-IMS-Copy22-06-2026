const mongoose = require("mongoose");

const deliveryChallanSchema = new mongoose.Schema(
  {
    challanNo: {
      type: String,
      required: true,
      unique: true,
    },

    challanType: {
      type: String,
      enum: [
        "against_invoice",
        "against_sales_order",
        "stock_transfer",
        "job_work",
        "sample",
        "return_to_supplier",
        "exhibition",
        "consignment",
        "other",
      ],
      required: true,
      default: "other",           // ← changed from "against_invoice"
    },

    transportMode: {
      type: String,
      enum: ["roadways", "railways", null],
      default: null,
    },

    subMode: {
      type: String,
      enum: ["LR", "RR", null],   // ← add null so default: null is valid
      default: null,
    },

    lrNo: { type: String, default: null },
    railwayReceiptNo: { type: String, default: null },
    wagonNo: { type: String, default: null },
    trainNo: { type: String, default: null },
    railwayWagonNo: { type: String, default: null },
    railwayTrainNo: { type: String, default: null },
    rrbNo: { type: String, default: null },

    freightCharge: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },   // ← add
    grandTotal: { type: Number, default: 0 },

    // Payment — collected in frontend but was missing from schema
    paidAmount: { type: Number, default: 0 },   // ← add
    dueAmount: { type: Number, default: 0 },   // ← add
    fullyReceived: { type: Boolean, default: false }, // ← add
    paymentMethod: { type: String, default: "" },  // ← add

    // Source reference — null NOT in enum array, just as default
    sourceType: {
      type: String,
      enum: ["Invoice", "SalesOrder", "Proforma"],  // ← remove null from array
      default: null,                                 //   keep null as default
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sourceType",
      default: null,
    },

    // Customer
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    customerGstin: { type: String, default: "" },
    customerState: { type: String, default: "" },
    customerCity: { type: String, default: "" },
    customerPincode: { type: String, default: "" },

    // Transport
    transporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transporter",
      default: null,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    // Items
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        itemName: { type: String, default: "" },
        qty: { type: Number, default: 0 },
        dispatchedQty: { type: Number, default: 0 },
        unit: { type: String, default: "Piece" },
        serialNumbers: [String],
        lotNumber: { type: String, default: "" },
        reason: { type: String, default: "" },
        hsnCode: { type: String, default: "" },
        description: { type: String, default: "" },
        unitPrice: { type: Number, default: 0 },
        taxRate: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        discountPct: { type: Number, default: 0 },  // ← add
        discountAmt: { type: Number, default: 0 },  // ← add
        amount: { type: Number, default: 0 },
        selectedColor: { type: String, default: "" }, // ← add for variants
        selectedSize: { type: String, default: "" },  // ← add for variants
        additionalDiscountPct: {
          type: Number,
          default: 0
        },
        additionalDiscountAmt: {
          type: Number,
          default: 0
        },
        additionalCharges: {
          type: Number,
          default: 0
        },
      },
    ],

    // Dates
    challanDate: { type: Date, default: Date.now },
    expectedReturnDate: { type: Date, default: null },
    actualReturnDate: { type: Date, default: null },

    status: {
      type: String,
      enum: ["pending", "dispatched", "delivered", "returned", "cancelled"],
      default: "pending",
    },

    // E-Way Bill
    ewayBillNo: { type: String, default: "" },
    ewayBillDate: { type: Date, default: null },
    ewbId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EWB",
      default: null,
    },
    ewbStatus: {
      type: String,
      enum: ["GENERATED", "CANCELLED", "FAILED", ""],
      default: "",
    },

    // Addresses
    fromAddress: { type: String, default: "" },
    toAddress: { type: String, default: "" },
    purposeOfMovement: { type: String, default: "" },
    notes: { type: String, default: "" },

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

    // Conversion tracking
    generatedInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerInvoice",
      default: null,
    },
    generatedInvoiceNo: { type: String, default: null }, // ← add for quick display
    convertedAt: { type: Date, default: null },   // ← add

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  { timestamps: true }
);

const forMaster = (conn) =>
  conn.models.DeliveryChallan ||
  conn.model("DeliveryChallan", deliveryChallanSchema);

const forTenant = (conn) =>
  conn.models.DeliveryChallan ||
  conn.model("DeliveryChallan", deliveryChallanSchema);

const getDeliveryChallanModel = (conn) =>
  conn.models.DeliveryChallan ||
  conn.model("DeliveryChallan", deliveryChallanSchema);

module.exports = { forMaster, forTenant, getDeliveryChallanModel };