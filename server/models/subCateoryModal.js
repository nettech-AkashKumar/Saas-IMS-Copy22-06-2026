// models/Subcategory.js
const mongoose = require("mongoose");

const SubcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ allow same name in different categories
SubcategorySchema.index({ name: 1, category: 1 }, { unique: true });

// ✅ Connection-scoped model factory
const getSubcategoryModel = (conn) => {
  if (!conn) {
    return mongoose.models.Subcategory || mongoose.model("Subcategory", SubcategorySchema);
  }
  return conn.models.Subcategory || conn.model("Subcategory", SubcategorySchema);
};

const forMaster = (conn) => {
  return getSubcategoryModel(conn);
};

const forTenant = (conn) => {
  return getSubcategoryModel(conn);
};

const SubcategoryModel = getSubcategoryModel();
SubcategoryModel.forMaster = forMaster;
SubcategoryModel.forTenant = forTenant;

module.exports = SubcategoryModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
