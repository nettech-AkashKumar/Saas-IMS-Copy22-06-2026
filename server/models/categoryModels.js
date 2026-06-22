// models/Category.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
        default: [], // ✅ MUST
      },
    ],
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Connection-scoped model factory
const getCategoryModel = (conn) => {
  if (!conn) {
    return mongoose.models.Category || mongoose.model("Category", categorySchema);
  }
  return conn.models.Category || conn.model("Category", categorySchema);
};

const forMaster = (conn) => {
  return getCategoryModel(conn);
};

const forTenant = (conn) => {
  return getCategoryModel(conn);
};

const CategoryModel = getCategoryModel();
CategoryModel.forMaster = forMaster;
CategoryModel.forTenant = forTenant;

module.exports = CategoryModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;


// // models/Category.js
// const mongoose = require("mongoose");

// const categorySchema = new mongoose.Schema(
//   {
//     categoryName: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//     },
//     subcategories: [
//       {
//         subCategoryName: String,
//       },
//     ],
//     noOfProducts: {
//       type: Number,
//       default: 0,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Category", categorySchema);
