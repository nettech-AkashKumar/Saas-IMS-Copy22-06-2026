const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    currencySymbol: {
      type: String,
      default: "₹",
    },
    description: {
      type: String,
      default: "",
    },
    offerType: {
      type: String,
      enum: ["fixed", "percentage", "none"],
      default: "none",
    },
    offerValue: {
      type: Number,
      default: 0,
    },
    features: [
      {
        name: String,
        included: Boolean,
      },
    ],
    modulePermissions: {
      type: Object,
      default: {},
    },
    recommended: {
      type: Boolean,
      default: false,
    },
    buttonText: {
      type: String,
      default: "Get Started",
    },
    buttonUrl: {
      type: String,
      default: "#",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = (db) => {
  return db.model("Pricing", pricingSchema);
};
