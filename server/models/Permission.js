import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "brand"
  actions: [
    {
      type: String,
      enum: ["create", "read", "update", "delete", "all"],
    },
  ],
});

// ✅ Connection-scoped model factory
const getPermissionModel = (conn) => {
  if (!conn) {
    return mongoose.models.Permission || mongoose.model("Permission", permissionSchema);
  }
  return conn.models.Permission || conn.model("Permission", permissionSchema);
};

const forMaster = (conn) => {
  return getPermissionModel(conn);
};

const forTenant = (conn) => {
  return getPermissionModel(conn);
};

const PermissionModel = getPermissionModel();
PermissionModel.forMaster = forMaster;
PermissionModel.forTenant = forTenant;

export default PermissionModel;
