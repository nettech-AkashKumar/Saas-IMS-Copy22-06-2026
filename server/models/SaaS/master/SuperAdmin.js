// src/models/master/SuperAdmin.model.js
const mongoose = require("mongoose");

const SuperAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

/**
 * Export a function that takes a mongoose connection.
 * This ensures we don't register the model multiple times.
 *
 * Usage:
 *   const connectMasterDB = require("../config/masterDb");
 *   const SuperAdmin = require("../models/master/SuperAdmin.model")(await connectMasterDB());
 */
module.exports = (conn) =>
  conn.models.SuperAdmin || conn.model("SuperAdmin", SuperAdminSchema, "superadmins");
