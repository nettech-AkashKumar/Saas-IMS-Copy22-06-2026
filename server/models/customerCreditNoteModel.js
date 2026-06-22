// models/CustomerCreditNoteModel.js
const mongoose = require('mongoose');

const creditNoteSchema = new mongoose.Schema({
  creditNoteNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerInvoice',
  },
  invoiceNumber: {
    type: String
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      default: 'pcs'
    },
    unitPrice: {
      type: Number,
      required: true
    },
    hsn: {
      type: String,
      default: ""
    },
    // Tax fields from invoice
    taxType: {
      type: String,
      default: "GST 0%"
    },
    taxRate: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    discountPercent: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  totalTax: {
    type: Number,
    default: 0
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  // Additional charges like invoice
  additionalCharges: {
    type: Number,
    default: 0
  },
  additionalChargesDetails: {
    shipping: { type: Number, default: 0 },
    handling: { type: Number, default: 0 },
    packing: { type: Number, default: 0 },
    service: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // Shopping points (if applicable)
  shoppingPointsUsed: { type: Number, default: 0 },
  pointValue: { type: Number, default: 10 },

  // Auto round off like invoice
  autoRoundOff: {
    type: String,
    enum: ["0", "1", "5", "10"],
    default: "0"
  },
  roundOff: {
    type: Number,
    default: 0
  },

  totalAmount: {
    type: Number,
    required: true
  },

  // Tax settings from invoice
  taxSettings: {
    enableGSTBilling: { type: Boolean, default: true },
    priceIncludeGST: { type: Boolean, default: true },
    defaultGSTRate: { type: String, default: "18" }
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  appliedToInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerInvoice'
  },
  appliedDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  notes: String,
  attachments: [{
    url: { type: String },
    public_id: { type: String },
    filename: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Calculate totals method similar to invoice
creditNoteSchema.methods.calculateTotals = function () {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  // Calculate total tax
  this.totalTax = this.items.reduce((sum, item) => {
    return sum + (item.taxAmount || 0);
  }, 0);

  // Calculate total discount
  this.totalDiscount = this.items.reduce((sum, item) => {
    return sum + (item.discountAmount || 0);
  }, 0);

  // Calculate additional charges
  const additionalChargesDetails = this.additionalChargesDetails || {};
  this.additionalCharges = Object.values(additionalChargesDetails).reduce((sum, charge) => sum + charge, 0);

  // Calculate points redeemed amount
  const pointsRedeemedAmount = (this.shoppingPointsUsed || 0) * (this.pointValue || 10);

  // Calculate total before round off
  let totalBefore = this.subtotal + this.totalTax + this.additionalCharges - this.totalDiscount - pointsRedeemedAmount;

  // Apply round off if enabled
  if (this.autoRoundOff !== "0") {
    const roundValue = parseInt(this.autoRoundOff);
    if (roundValue > 0) {
      this.roundOff = Math.round(totalBefore / roundValue) * roundValue - totalBefore;
      this.totalAmount = Math.max(0, Math.round(totalBefore / roundValue) * roundValue);
    } else {
      this.roundOff = 0;
      this.totalAmount = Math.max(0, totalBefore);
    }
  } else {
    this.roundOff = 0;
    this.totalAmount = Math.max(0, totalBefore);
  }
};

// Pre-save middleware
creditNoteSchema.pre('save', function (next) {
  // Recalculate totals before saving
  this.calculateTotals();

  // Ensure taxSettings has all fields
  if (!this.taxSettings) {
    this.taxSettings = {
      enableGSTBilling: true,
      priceIncludeGST: true,
      autoRoundOff: "0",
      defaultGSTRate: "18"
    };
  }

  next();
});

const getCustomerCreditNoteModel = (conn) => {
  if (!conn) {
    return mongoose.models.CustomerCreditNote || mongoose.model("CustomerCreditNote", creditNoteSchema);
  }
  return conn.models.CustomerCreditNote || conn.model("CustomerCreditNote", creditNoteSchema);
};

const forMaster = (conn) => {
  return getCustomerCreditNoteModel(conn);
};

const forTenant = (conn) => {
  return getCustomerCreditNoteModel(conn);
};

const CustomerCreditNoteModel = getCustomerCreditNoteModel();
CustomerCreditNoteModel.forMaster = forMaster;
CustomerCreditNoteModel.forTenant = forTenant;

module.exports = CustomerCreditNoteModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
