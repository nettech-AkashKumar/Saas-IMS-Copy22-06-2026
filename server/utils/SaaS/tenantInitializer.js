/**
 * ============================
 * ✅ TENANT DATABASE INITIALIZER
 * ============================
 * 
 * When a new company/tenant is created with a subdomain,
 * this function initializes all required collections and models
 * in the tenant database.
 * 
 * Usage:
 *   const tenantConn = await getTenantDB(dbName);
 *   await initializeTenantDB(tenantConn);
 */

const getTenantDB = require("../../config/SaaS/tenantDb");

// Import all tenant-scoped models
const User = require("../../models/usersModels");
const Role = require("../../models/roleModels");
const Product = require("../../models/productModels");
const Category = require("../../models/categoryModels");
const Brand = require("../../models/brandModels");
const CompanySetting = require("../../models/settings/companysettingmodal");
const SystemSettings = require("../../models/systemSettingsModels");
const Warehouse = require("../../models/warehouseModels");
const Supplier = require("../../models/supplierModel");
const Customer = require("../../models/customerModel");
const Purchase = require("../../models/purchaseModels");
const Sales = require("../../models/salesModel");
const Invoice = require("../../models/invoiceModel");
const Tax = require("../../models/taxModels");
const Unit = require("../../models/unitsModels");
const Size = require("../../models/sizeModels");
const Color = require("../../models/colorModels");

// List of all model factories (forTenant)
const TENANT_MODELS = [
  { name: "User", model: User, factory: "forTenant" },
  { name: "Role", model: Role, factory: "forTenant" },
  { name: "Product", model: Product, factory: "forTenant" },
  { name: "Category", model: Category, factory: "forTenant" },
  { name: "Brand", model: Brand, factory: "forTenant" },
  { name: "CompanySetting", model: CompanySetting, factory: "forTenant" },
  { name: "SystemSettings", model: SystemSettings, factory: "forTenant" },
  { name: "Warehouse", model: Warehouse, factory: "forTenant" },
  { name: "Supplier", model: Supplier, factory: "forTenant" },
  { name: "Customer", model: Customer, factory: "forTenant" },
  { name: "Purchase", model: Purchase, factory: "forTenant" },
  { name: "Sales", model: Sales, factory: "forTenant" },
  { name: "Invoice", model: Invoice, factory: "forTenant" },
  { name: "Tax", model: Tax, factory: "forTenant" },
  { name: "Unit", model: Unit, factory: "forTenant" },
  { name: "Size", model: Size, factory: "forTenant" },
  { name: "Color", model: Color, factory: "forTenant" },
];

/**
 * Initialize all models in tenant database
 * This ensures all collections are created and indexed
 * 
 * @param {Object} tenantConn - MongoDB connection for tenant
 * @returns {Promise<Object>} Summary of initialized models
 */
const initializeTenantDB = async (tenantConn) => {
  try {
    console.log(`\n🚀 Initializing Tenant Database: ${tenantConn.name}\n`);

    const initialized = [];
    const errors = [];

    // Initialize each model
    for (const modelConfig of TENANT_MODELS) {
      try {
        const ModelFactory = modelConfig.model;
        if (!ModelFactory[modelConfig.factory]) {
          console.warn(`⚠️ Model ${modelConfig.name} does not have ${modelConfig.factory} factory`);
          continue;
        }

        // Get connection-scoped model
        const TenantModel = ModelFactory[modelConfig.factory](tenantConn);

        // Initialize indexes (this creates empty collection if not exists)
        await TenantModel.collection.getIndexes();

        initialized.push(modelConfig.name);
        console.log(`✅ ${modelConfig.name} initialized`);
      } catch (error) {
        const errorMsg = `${modelConfig.name}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`\n✅ Tenant Database Initialization Complete`);
    console.log(`📊 Initialized: ${initialized.length}/${TENANT_MODELS.length} models\n`);

    return {
      success: true,
      tenantDbName: tenantConn.name,
      initializedModels: initialized,
      errors: errors,
      totalModels: initialized.length,
    };
  } catch (error) {
    console.error(`❌ Tenant DB Initialization Failed:`, error.message);
    throw error;
  }
};

/**
 * Initialize models for a tenant by dbName
 * Finds/creates the database connection and initializes all models
 * 
 * @param {string} dbName - Tenant database name
 * @returns {Promise<Object>} Summary of initialization
 */
const initializeTenantByDbName = async (dbName) => {
  try {
    console.log(`🔗 Getting tenant connection for: ${dbName}`);
    const tenantConn = await getTenantDB(dbName);
    
    console.log(`✅ Connection established: ${tenantConn.name}`);
    
    return await initializeTenantDB(tenantConn);
  } catch (error) {
    console.error(`❌ Failed to initialize tenant ${dbName}:`, error.message);
    throw error;
  }
};

module.exports = {
  initializeTenantDB,
  initializeTenantByDbName,
  TENANT_MODELS,
};
