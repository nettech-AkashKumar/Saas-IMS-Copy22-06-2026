require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;
const dbName = (process.env.SAAS_MASTER_DB || '').trim();

if (!uri || !dbName) {
  console.error('Missing MONGO_URI or SAAS_MASTER_DB');
  process.exit(1);
}

(async () => {
  try {
    const conn = await mongoose.createConnection(uri + dbName, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const CompanySchema = new mongoose.Schema({}, { strict: false, collection: 'companies' });
    const Company = conn.model('Company', CompanySchema);
    const companies = await Company.find().limit(20).lean();
    console.log(JSON.stringify(companies.map(c => ({ subdomain: c.subdomain, dbName: c.dbName, isActive: c.isActive })), null, 2));
    await conn.close();
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
