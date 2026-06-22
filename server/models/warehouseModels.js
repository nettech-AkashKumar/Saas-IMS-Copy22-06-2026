const mongoose = require("mongoose");

const rackLevelSchema = new mongoose.Schema(
  {
    level: Number,
    barcode: String,
  },
  { _id: false },
);

// const rackSchema = new mongoose.Schema(
//   {
//     rackLabel: String,
//     shelfLevels: Number,
//     capacity: Number,
//     levels: [rackLevelSchema],
//   },
//   { _id: false },
// );

const blockItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // Changed from itemId to productId
    quantity: { type: Number, default: 1, min: 0 }, // Default quantity to 1
    barcode: { type: String, required: false }, // Make barcode optional or generate it
  },
  { _id: false },
);

const cellSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "1", "2", ..., "15"
    items: [blockItemSchema],
  },
  { _id: false },
);

const storedProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    quantity: {
      type: Number,
      default: 1,
    },

    unit: {
      type: String,
      default: "Pcs",
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const zoneSchema = new mongoose.Schema(
  {
    zoneCode: String,
    zoneName: String,
    type: String,
    capacity: Number,
    notes: String,

    racks: [
      {
        rackCode: String,
        rackName: String,
        rackQRCode: String,

        active: {
          type: Boolean,
          default: true,
        },

        shelves: [
          {
            shelfCode: String,
            shelfName: String,
            shelfQRCode: String,

            active: {
              type: Boolean,
              default: true,
            },

            bins: [
              {
                binName: String,
                binQRCode: String,
                products: [storedProductSchema],
              },
            ],
          },
        ],
      },
    ],
  },
  { _id: false },
);

const warehouseSchema = new mongoose.Schema(
  {
    warehouseName: {
      type: String,
      required: true,
    },
    space: {
      type: String,
      //   required: true
    },
    items: {
      type: String,
      // required: true
    },
    itemSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    contactPerson: { type: String },
    warehouseCode: { type: String, required: true },
    warehouseOwner: { type: String, required: true },

    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      //  required: true
    },
    phoneWork: String,
    // streetAddress: String,
    address: { type: String, required: true },

    country: {
      // type: mongoose.Schema.Types.ObjectId,
      type: String,
      // ref: "Country",
      required: true,
    },
    state: {
      // type: mongoose.Schema.Types.ObjectId,
      type: String,
      // ref: "State",
      required: true,
    },
    city: {
      // type: mongoose.Schema.Types.ObjectId,
      type: String,
      // ref: "City",
      required: true,
    },
    // postalCode: {
    //     type: String,
    //     // required: true
    //  },
    pinCode: {
      type: String,
      required: true,
    },
    layout: {
      rows: { type: Number },
      columns: { type: Number },
      width: { type: Number },
      zones: { type: Number },
    },
    //   status: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    capacityEstimate: { type: Number }, // Optional but useful
    zones: [zoneSchema],
    // racks: [rackSchema],
    isFavorite: {
      type: Boolean,
      default: false,
    },
    //  Racks embedded here
  },
  { timestamps: true },
);

const transferItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: String,

    locationCode: String,

    unit: {
      type: String,
      default: "Pcs",
    },

    totalQty: {
      type: Number,
      required: true,
    },

    transferQty: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const transferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      unique: true,
    },

    sourceWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    destinationWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    products: [transferItemSchema],

    vehicleNumber: {
      type: String,
      default: "",
    },

    contactPerson: {
      type: String,
      required: true,
    },

    contactNumber: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "In Transit", "Completed", "Cancelled"],
      default: "Pending",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// ✅ Connection-scoped model factory
const getWarehouseModel = (conn) => {
  if (!conn) {
    return (
      mongoose.models.Warehouse || mongoose.model("Warehouse", warehouseSchema)
    );
  }
  return conn.models.Warehouse || conn.model("Warehouse", warehouseSchema);
};

const forMaster = (conn) => {
  return getWarehouseModel(conn);
};

const forTenant = (conn) => {
  return getWarehouseModel(conn);
};

const WarehouseModel = getWarehouseModel();
WarehouseModel.forMaster = forMaster;
WarehouseModel.forTenant = forTenant;

module.exports = WarehouseModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;

// const mongoose = require("mongoose");

// const warehouseSchema = new mongoose.Schema({
//   warehouseName: { type: String, required: true },
//   warehouseCode: { type: String, required: true, unique: true },
//   warehouseOwner: { type: String, required: true },
//   address: { type: String, required: true },

//   country: { type: String,ref: "Country",  required: true },
//   state: { type: String, ref: "State", required: true },
//   city: { type: String,ref: "City" },

//   pinCode: { type: String },
//   layout: {
//     rows: Number,
//     columns: Number,
//     width: Number,
//     zones: Number
//   }
// }, { timestamps: true });

// module.exports = mongoose.model("Warehouse", warehouseSchema);

// const mongoose = require("mongoose");

// const warehouseSchema = new mongoose.Schema({
//   warehouseName: { type: String, required: true },
//   space: { type: String, required: true },
//   items: { type: String, required: true },
//   contactPerson: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   phone: { type: String, required: true },
//   email: { type: String, required: true },
//   phoneWork: String,
//   streetAddress: String,
//   country: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
//   state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true },
//   city: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: true },
//   postalCode: { type: String, required: true },
//   status: { type: Boolean, default: true },
// }, { timestamps: true });

// module.exports = mongoose.model("Warehouse", warehouseSchema);
