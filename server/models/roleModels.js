// models/roleModels.js
const mongoose = require("mongoose");

// ✅ Permission schema matching your sidebar needs
const permissionSchema = new mongoose.Schema(
  {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    export: { type: Boolean, default: false }, // ADDED
    import: { type: Boolean, default: false }, // ADDED
    all: { type: Boolean, default: false }, // Added "all" field for easy checking
  },
  { _id: false },
);

// Main Role Schema
const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    // ✅ ONLY ONE structure now - modulePermissions
    modulePermissions: {
      type: Map,
      of: permissionSchema,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for member count
roleSchema.virtual("memberCount", {
  ref: "Users",
  localField: "_id",
  foreignField: "role",
  count: true,
});

const getRoleModel = (conn) => {
  // 🚫 STRICT: Never use default connection if conn is required
  if (!conn) {
    throw new Error("❌ Connection object is required to get Role model. Cannot use default connection!");
  }

  if (!conn.models || typeof conn.model !== "function") {
    throw new Error("❌ Invalid connection object passed to Role model");
  }

  return conn.models.Role || conn.model("Role", roleSchema);
};

const forMaster = (conn) => {
  if (!conn) {
    throw new Error("❌ Master DB connection is required");
  }
  // console.log(`🏗️ Creating Role model for master DB: ${conn.name}`);
  const model = getRoleModel(conn);
  // console.log(`✅ Role model created for ${conn.name}`);
  return model;
};

const forTenant = (conn) => {
  if (!conn) {
    throw new Error("❌ Tenant DB connection is required");
  }
  // console.log(`🏗️ Creating Role model for tenant DB: ${conn.name}`);
  const model = getRoleModel(conn);
  // console.log(`✅ Role model created for ${conn.name}`);
  return model;
};

// ✅ Export only connection-scoped factories (no default model)
module.exports = {
  forMaster,
  forTenant,
};

module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
