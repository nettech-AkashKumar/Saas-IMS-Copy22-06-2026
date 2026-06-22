// models/Shipment.js
const mongoose = require("mongoose");

const shipmentItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    default: null
  },
  itemName: { type: String, required: true },
  description: { type: String },
  hsnCode: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: "Piece" },
  unitPrice: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxType: { type: String, default: "GST 0%" },
  taxAmount: { type: Number, default: 0 },
  discountPct: { type: Number, default: 0 },
  discountAmt: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  volume: { type: Number, default: 0 },
  selectedSerialNos: [{ type: String }],
  lotNumber: { type: String }
});

const trackingHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  location: { type: String },
  remarks: { type: String },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" }
});

const shipmentSchema = new mongoose.Schema({
  // ========== Basic Identification ==========
  shipmentNo: { type: String, unique: true, required: true },
  shipmentDate: { type: Date, default: Date.now },
  expectedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },

  // ========== Transport Mode ==========
  transportMode: {
    type: String,
    enum: ['roadways', 'airways', 'shipways', 'railways'],
    required: true
  },

  // ========== ROADWAYS - LR (Truck) ==========
  subMode: { type: String, enum: ['LR', 'RR'], default: null },
  transporterId: { type: mongoose.Schema.Types.ObjectId, ref: "Transporter", default: null },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
  lrNo: { type: String },
  lrDate: { type: Date },

  // ========== ROADWAYS - RR (Train) ==========
  wagonNo: { type: String },
  trainNo: { type: String },
  railwayReceiptNo: { type: String },

  // ========== AIRWAYS ==========
  flightNo: { type: String },
  airwayBillNo: { type: String },
  cargoType: {
    type: String,
    enum: ['General', 'Perishable', 'Dangerous', 'Live Animal'],
    default: 'General'
  },

  // ========== SHIPWAYS ==========
  vesselName: { type: String },
  containerNo: { type: String },
  portOfLoading: { type: String },
  portOfDischarge: { type: String },
  billOfLading: { type: String },

  // ========== RAILWAYS (Simple) ==========
  railwayWagonNo: { type: String },
  railwayTrainNo: { type: String },

  // ========== Consignor (Sender) ==========
  consignor: {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    gstin: { type: String },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null }
  },

  // ========== Consignee (Receiver) ==========
  consignee: {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String, required: false},
    gstin: { type: String },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null }
  },

  // ========== Addresses ==========
  fromAddress: { type: String, required: true },
  toAddress: { type: String, required: true },

  // ========== Items ==========
  items: [shipmentItemSchema],
  // 🔽 ADD FINANCIAL FIELDS HERE (after items, before status)
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
  grandTotal: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  advanceAmount: { type: Number, default: 0 },
  fullyReceived: { type: Boolean, default: false },
  paymentMethod: { type: String, default: "cash" },
  shoppingPointsUsed: { type: Number, default: 0 },
  pointValue: { type: Number, default: 10 },
  taxSettings: {
    enableGSTBilling: { type: Boolean, default: true },
    priceIncludeGST: { type: Boolean, default: true },
    autoRoundOff: { type: String, default: "0" },
    defaultGSTRate: { type: String, default: "18" }
  },

  // ========== Shipment Status ==========
  status: { type: String, enum: ['draft', 'assigned', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled'], default: 'draft' },

  // ========== Tracking History ==========
  trackingHistory: [trackingHistorySchema],

  // ========== Delivery Proof ==========
  deliveredAt: { type: Date },
  deliveryProofImage: { type: String },
  receivedByName: { type: String },
  receivedBySignature: { type: String },
  invoicePaymentStatus: { type: String, default: null },
  invoicePaidAmount: { type: Number, default: 0 },
  invoiceDueAmount: { type: Number, default: 0 },
  invoiceFullyReceived: { type: Boolean, default: false },

  // ========== Charges ==========
  freightCharge: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  totalCharges: { type: Number, default: 0 },

 

statusHistory: [{
  status: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  notes: { type: String },
  location: { type: String }
}],

  // ========== Link to Invoice (optional) ==========
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerInvoice", required: true },
  invoiceNo: { type: String, required: true },

  // ========== Notes ==========
  notes: { type: String },
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

  // ========== Audit ==========
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" }

}, { timestamps: true });

// ========== Pre-save Middleware ==========
shipmentSchema.pre('save', async function (next) {
  // Add validation to ensure shipment is always created from an invoice
  if (!this.invoiceId) {
    const error = new Error('Shipment must be created from an invoice');
    error.status = 400;
    return next(error);
  }
  if (!this.shipmentNo) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.shipmentNo = `SHP${year}${month}${random}`;
  }

  this.totalCharges = (this.freightCharge || 0) + (this.otherCharges || 0);
  next();
});

// ========== Virtuals ==========
shipmentSchema.virtual('isDelivered').get(function () {
  return this.status === 'delivered';
});

shipmentSchema.virtual('isCancelled').get(function () {
  return this.status === 'cancelled';
});

shipmentSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// ========== Methods ==========
shipmentSchema.methods.updateStatus = async function (newStatus, remarks, userId) {
  const oldStatus = this.status;
  this.status = newStatus;

  this.trackingHistory.push({
    status: newStatus,
    remarks: remarks || `Status changed from ${oldStatus} to ${newStatus}`,
    updatedBy: userId,
    updatedAt: new Date()
  });

  if (newStatus === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }

  await this.save();
  return this;
};

// ========== IMPORTANT: Add these functions to match your working pattern ==========
const getShipmentModel = (conn) => {
  return conn.models.Shipment || conn.model("Shipment", shipmentSchema);
};

const forMaster = (conn) => getShipmentModel(conn);
const forTenant = (conn) => getShipmentModel(conn);

// ========== Indexes ==========
// shipmentSchema.index({ shipmentNo: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ shipmentDate: -1 });
shipmentSchema.index({ "consignee.customerId": 1 });
shipmentSchema.index({ "consignor.customerId": 1 });

module.exports = {
  forMaster,
  forTenant,
  getShipmentModel,
};