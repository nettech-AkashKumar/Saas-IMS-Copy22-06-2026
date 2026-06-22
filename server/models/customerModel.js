// models/customerModel.js
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    gstin: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
      match: /^\d{6}$/,
    },

    // Points/Loyalty System Fields
    availablePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
    },
    totalPointsRedeemed: {
      type: Number,
      default: 0,
    },
    lastPointsEarnedDate: {
      type: Date,
    },
    lastPointsRedeemedDate: {
      type: Date,
    },

    // Customer Tier (optional for advanced loyalty)
    loyaltyTier: {
      type: String,
      enum: ["regular", "silver", "gold", "platinum"],
      default: "regular",
    },

    // Purchase History Summary
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalPurchaseAmount: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
    },
    lastPurchaseDate: {
      type: Date,
    },
    firstPurchaseDate: {
      type: Date,
    },
    totalDueAmount: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    customerType: {
      type: String,
      enum: ["normal", "due", "advance"],
      default: "normal"
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Method to add points
customerSchema.methods.addPoints = function (pointsToAdd, reason = "Purchase") {
  this.availablePoints += pointsToAdd;
  this.totalPointsEarned += pointsToAdd;
  this.lastPointsEarnedDate = new Date();

  // Update loyalty tier based on total purchases (optional)
  this.updateLoyaltyTier();

  return this.save();
};

// Method to redeem points
customerSchema.methods.redeemPoints = function (pointsToRedeem) {
  if (pointsToRedeem > this.availablePoints) {
    throw new Error("Insufficient points");
  }

  this.availablePoints -= pointsToRedeem;
  this.totalPointsRedeemed += pointsToRedeem;
  this.lastPointsRedeemedDate = new Date();

  return this.save();
};

// Method to update loyalty tier (optional)
customerSchema.methods.updateLoyaltyTier = function () {
  const totalSpent = this.totalPurchaseAmount;

  if (totalSpent >= 50000) {
    this.loyaltyTier = "platinum";
  } else if (totalSpent >= 25000) {
    this.loyaltyTier = "gold";
  } else if (totalSpent >= 10000) {
    this.loyaltyTier = "silver";
  } else {
    this.loyaltyTier = "regular";
  }

  return this;
};

// Method to update purchase stats
customerSchema.methods.updatePurchaseStats = function (purchaseAmount) {
  this.totalPurchases += 1;
  this.totalPurchaseAmount += purchaseAmount;
  this.averageOrderValue = this.totalPurchaseAmount / this.totalPurchases;
  this.lastPurchaseDate = new Date();

  return this.save();
};

customerSchema.add({
  creditNotes: [{
    creditNoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreditNote'
    },
    amount: Number,
    date: Date
  }]
});


// ================= MODEL FACTORY =================
const getCustomerModel = (conn) => {
  if (!conn) throw new Error("❌ Connection required");

  return (
    conn.models.Customer ||
    conn.model("Customer", customerSchema)
  );
};

module.exports = {
  forTenant: getCustomerModel,
  forMaster: getCustomerModel,
};

// const getCustomerModel = (conn) => {
//   if (!conn) {
//     return mongoose.models.Customer || mongoose.model("Customer", customerSchema);
//   }
//   return conn.models.Customer || conn.model("Customer", customerSchema);
// };

// const forMaster = (conn) => {
//   console.log(`🏗️ Creating Customer model for master DB: ${conn.name}`);
//   const model = getCustomerModel(conn);
//   console.log(`✅ Customer model created:`, typeof model);
//   return model;
// };

// const forTenant = (conn) => {
//   console.log(`🏗️ Creating Customer model for tenant DB: ${conn.name}`);
//   const model = getCustomerModel(conn);
//   console.log(`✅ Customer model created:`, typeof model);
//   return model;
// };

// const CustomerModel = getCustomerModel();
// CustomerModel.forMaster = forMaster;
// CustomerModel.forTenant = forTenant;

// module.exports = CustomerModel;
// module.exports.forMaster = forMaster;
// module.exports.forTenant = forTenant;