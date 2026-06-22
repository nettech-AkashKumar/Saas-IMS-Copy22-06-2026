// src/config/masterDb.js
const mongoose = require("mongoose");
const { MONGO_URI, SAAS_MASTER_DB } = require("../SaaS/env");

let masterConn;

const connectMasterDB = async () => {
  if (masterConn && masterConn.readyState === 1) return masterConn;

  const dbName = String(SAAS_MASTER_DB || "").replace(/^\/+|\/+$/g, "");
  const uri = String(MONGO_URI || "").replace(/\/+$/, "");

  if (!dbName) {
    throw new Error("SAAS_MASTER_DB is not configured");
  }
  if (!uri) {
    throw new Error("MONGO_URI is not configured");
  }

  const connectionOptions = {
    serverSelectionTimeoutMS: 30000, // 30s to select a server
    socketTimeoutMS: 30000, // 30s socket timeout
    maxPoolSize: 10, // Connection pool size
    minPoolSize: 2,
    retryWrites: true,
    retryReads: true,
    w: 1,
  };

  try {
    masterConn = await mongoose.createConnection(
      `${uri}/${dbName}`,
      connectionOptions
    ).asPromise();

    console.log("✅ Master DB connected:", masterConn?.name || dbName);

    // Handle connection events
    masterConn.on("disconnected", () => {
      console.warn("⚠️ Master DB disconnected");
      masterConn = null;
    });

    masterConn.on("error", (err) => {
      console.error("❌ Master DB error:", err.message);
      masterConn = null;
    });

    return masterConn;
  } catch (err) {
    masterConn = null;
    console.error("❌ Master DB connection failed:", err.message);
    throw err;
  }
};

module.exports = connectMasterDB;
