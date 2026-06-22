// src/config/tenantDb.js
const mongoose = require("mongoose");
const { MONGO_URI } = require("./env");

const connections = {};

const getTenantDB = async (dbName) => {
  const normalizedDbName = String(dbName || "").trim();

  if (!normalizedDbName || ["undefined", "null"].includes(normalizedDbName.toLowerCase())) {
    throw new Error("Valid tenant dbName is required");
  }

  const cleanDBName = normalizedDbName.replace(/^\/+|\/+$/g, "");

  if (["test", "admin", "local"].includes(cleanDBName.toLowerCase())) {
    throw new Error(`Refusing to connect to invalid tenant DB: ${cleanDBName}`);
  }

  // Check if connection exists and is healthy
  if (connections[cleanDBName] && connections[cleanDBName].readyState === 1) {
    return connections[cleanDBName];
  }

  const baseUri = String(MONGO_URI || "").replace(/\/+$/, "");
  if (!baseUri) {
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
    const conn = await mongoose.createConnection(
      `${baseUri}/${cleanDBName}`,
      connectionOptions
    ).asPromise();

    // console.log(`🔗 Tenant DB connected: ${conn.name}`);

    // Handle connection events
    conn.on("disconnected", () => {
      // console.warn(`⚠️ Tenant DB ${cleanDBName} disconnected`);
      delete connections[cleanDBName];
    });

    conn.on("error", (err) => {
      console.error(`❌ Tenant DB ${cleanDBName} error:`, err.message);
      delete connections[cleanDBName];
    });

    connections[cleanDBName] = conn;
    return conn;
  } catch (err) {
    delete connections[cleanDBName];
    console.error(`❌ Tenant DB ${cleanDBName} connection failed:`, err.message);
    throw err;
  }
};

module.exports = getTenantDB;
