// src/config/env.js
require("dotenv").config(); // load .env

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  SAAS_MASTER_DB: process.env.SAAS_MASTER_DB,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || 5000,
};
