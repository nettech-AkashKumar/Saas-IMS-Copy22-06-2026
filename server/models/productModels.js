const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", },

    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory", },

    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", },

    hsn: { type: mongoose.Schema.Types.ObjectId, ref: "HSN", },

    description: {
      type: String,
      default: "",
      validate: {
        validator: function (v) {
          if (!v) return true;
          const words = String(v).trim().split(/\s+/).filter(Boolean);
          return words.length <= 30;
        },
        message: "Description must be 30 words or fewer"
      }
    },

    itemBarcode: { type: String }, // master barcode

    productType: { type: String, enum: ["Single", "Variant"], default: "Single" },

    // lot/batch & Pricing-----------------------------------------------------------------------------------
    lot_pricing: { type: Boolean, required: true, }, // true: if it has more than one variant, false: for only one variant

    // Legacy fields for backward compatibility
    legacy_unit: { type: String, alias: 'unit' },

    dualUnit: { type: Boolean, default: false },
    secondaryUnitQuantity: { type: Number, min: 0 },
    secondaryUnit: { type: String },

    legacy_stockQuantity: { type: Number, default: 0, alias: 'stockQuantity' },
    legacy_purchasePrice: { type: Number, alias: 'purchasePrice' },
    legacy_sellingPrice: { type: Number, alias: 'sellingPrice' },

    checkedExpiry: { type: Boolean, default: false },
    checkedSerial: { type: Boolean, default: false },
    checkedBatch: { type: Boolean, default: false },
    checkedWarranty: { type: Boolean, default: false },

    // image----------------------------------------------------------------------------------------------------
    images: [{ url: { type: String, required: true }, public_id: { type: String, required: true }, },],

    isDelete: { type: Boolean, default: false, },

    variants: [
      {
        itemBarcode: { type: String }, // variant barcode
        lotNumber: { type: String },
        modelNo: { type: String },
        serialNumbers: [{ type: String }],
        purchasePrice: Number,
        purchasePriceTaxType: {
          type: String,
          enum: ["withgst", "withoutgst"],
          default: "withoutgst",
        },
        tax: { type: String },
        mrp: { type: Number },
        sellingPrice: { type: Number },
        gst: { type: Boolean, default: false },

        size: { type: String },
        color: { type: String },

        openingQuantity: { type: Number },
        stockQuantity: { type: Number },
        minStockToMaintain: { type: Number },
        discountAmount: { type: Number },
        discountType: { type: String },
        manufacturingDate: { type: Date },
        expiryDate: { type: Date },
        unit: { type: String },

        // warranty------------------------------------------------------------------------------
        warrantyType: { type: String },
        warrantyPeriod: { type: Number },

        // 1
        coverageScope: { type: String },
        serviceMode: { type: String },
        maxClaimsAllowed: { type: Number },
        inspectionRequired: { type: Boolean },
        warrantyStartsFrom: { type: String },

        // 2
        linkedto: { type: String },
        extensionPeriod: { type: String },
        coverageType: { type: String },
        extendedWarrantyPrice: { type: Number },

        // 3
        lifetimeDefination: { type: String },
        coverageOf: { type: String },
        whatNotCovered: { type: String },
        maxClaims: { type: Number },
        replacementOnceOnly: { type: Boolean },

        images: [{ url: { type: String, required: true }, public_id: { type: String, required: true }, },],
      }
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  },
);

// Virtuals for backward compatibility with top-level fields
productSchema.virtual('lotNumber').get(function () {
  return this.variants && this.variants.length > 0 ? this.variants[0].lotNumber : "";
});

productSchema.virtual('serialno').get(function () {
  return this.variants && this.variants.length > 0 ? this.variants[0].serialNumbers : [];
});

productSchema.virtual('unit').get(function () {
  return (this.variants && this.variants.length > 0) ? this.variants[0].unit : (this.legacy_unit || "");
});

productSchema.virtual('purchasePrice').get(function () {
  return (this.variants && this.variants.length > 0) ? this.variants[0].purchasePrice : (this.legacy_purchasePrice || 0);
});

productSchema.virtual('tax').get(function () {
  return this.variants && this.variants.length > 0 ? this.variants[0].tax : "";
});

productSchema.virtual('openingQuantity').get(function () {
  return (this.variants && this.variants.length > 0)
    ? (this.variants || []).reduce((sum, v) => sum + (v.openingQuantity || 0), 0)
    : (this.legacy_stockQuantity || 0);
});

productSchema.virtual('stockQuantity').get(function () {
  return (this.variants && this.variants.length > 0)
    ? (this.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
    : (this.legacy_stockQuantity || 0);
});

productSchema.virtual('sellingPrice').get(function () {
  return (this.variants && this.variants.length > 0) ? this.variants[0].sellingPrice : (this.legacy_sellingPrice || 0);
});

productSchema.virtual('mrp').get(function () {
  return this.variants && this.variants.length > 0 ? this.variants[0].mrp : 0;
});

productSchema.virtual('size').get(function () {
  return this.variants && this.variants.length > 0 ? this.variants[0].size : "";
});

productSchema.virtual('color').get(function () {
  return this.variants && this.variants.length > 0 ? this.variants[0].color : "";
});

productSchema.virtual('minStockToMaintain').get(function () {
  return this.variants && this.variants.length > 0 ? this.variants[0].minStockToMaintain : 0;
});

productSchema.virtual('discountAmount').get(function () {
  return this.variants && this.variants.length > 0 ? this.variants[0].discountAmount : 0;
});

productSchema.virtual('discountType').get(function () {
  return this.variants && this.variants.length > 0 ? this.variants[0].discountType : "Fixed";
});

productSchema.virtual('quantity').get(function () {
  return (this.variants && this.variants.length > 0)
    ? (this.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
    : (this.legacy_stockQuantity || 0);
});

// ✅ Connection-scoped model factory
const getProductModel = (conn) => {
  if (!conn) {
    return mongoose.models.Product || mongoose.model("Product", productSchema);
  }
  return conn.models.Product || conn.model("Product", productSchema);
};

const forMaster = (conn) => {
  return getProductModel(conn);
};

const forTenant = (conn) => {
  return getProductModel(conn);
};

const ProductModel = getProductModel();
ProductModel.forMaster = forMaster;
ProductModel.forTenant = forTenant;

module.exports = ProductModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
