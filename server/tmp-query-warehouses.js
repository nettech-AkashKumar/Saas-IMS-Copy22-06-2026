require('dotenv').config();
const mongoose = require('mongoose');
const getTenantDB = require('./config/SaaS/tenantDb');
const WarehouseModel = require('./models/warehouseModels');

const uri = process.env.MONGO_URI;
const dbName = (process.env.SAAS_MASTER_DB || '').trim();

if (!uri || !dbName) {
  console.error('Missing MONGO_URI or SAAS_MASTER_DB');
  process.exit(1);
}

const searchNames = [
  'Akash Cold Storage',
  'Aman Warehouse',
];

(async () => {
  try {
    const masterConn = await mongoose.createConnection(uri + dbName, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
      w: 1,
    }).asPromise();

    const CompanySchema = new mongoose.Schema({}, { strict: false, collection: 'companies' });
    const Company = masterConn.model('Company', CompanySchema);
    const companies = await Company.find().lean();

    const results = [];

    for (const company of companies) {
      const tenantDbName = String(company.dbName || '').trim();
      if (!tenantDbName) continue;
      try {
        const tenantConn = await getTenantDB(tenantDbName);
        const Warehouse = WarehouseModel.forTenant(tenantConn);
        const warehouses = await Warehouse.find({ warehouseName: { $in: searchNames } }).lean();
        if (warehouses.length) {
          results.push({
            company: company.subdomain || company.dbName,
            dbName: tenantDbName,
            warehouses: warehouses.map(w => ({ warehouseName: w.warehouseName, status: w.status, _id: w._id })),
          });
        }
      } catch (err) {
        console.error('Tenant query failed for', tenantDbName, err.message);
      }
    }

    console.log(JSON.stringify(results, null, 2));
    await masterConn.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
