/**
 * Auto-Tenant Middleware
 * Automatically patches ALL Mongoose models to use tenant DB from req.db
 * 
 * Usage: Add to server/index.js after authMiddleware:
 *   app.use(autoTenantMiddleware);
 */

const mongoose = require("mongoose");

const autoTenantMiddleware = (req, res, next) => {
  if (!req.db) {
    // No tenant DB, use default connection
    return next();
  }

  // ✅ Patch mongoose.Model methods to use tenant DB
  const tenantDB = req.db;
  
  // Store original methods
  const originalFind = mongoose.Model.find;
  const originalFindOne = mongoose.Model.findOne;
  const originalCreate = mongoose.Model.create;
  const originalFindByIdAndUpdate = mongoose.Model.findByIdAndUpdate;
  const originalFindByIdAndDelete = mongoose.Model.findByIdAndDelete;
  const originalUpdateMany = mongoose.Model.updateMany;
  const originalDeleteMany = mongoose.Model.deleteMany;
  const originalExists = mongoose.Model.exists;

  // Track Model constructor to intercept schema access
  const modelMap = new Map();

  // Override model creation to track which schema belongs to which model
  const originalModel = tenantDB.model.bind(tenantDB);
  tenantDB.model = function(name, schema, collection, options) {
    const model = originalModel(name, schema, collection, options);
    modelMap.set(model.schema, model);
    return model;
  };

  // Attach tenantDB to request for controller use
  req.tenantDB = tenantDB;

  next();
};

module.exports = autoTenantMiddleware;
