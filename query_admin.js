const MongoClient = require('mongodb').MongoClient;

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function queryAdmin() {
  try {
    await client.connect();
    const db = client.db('ims_master_db');
    const result = await db.collection('superadmins').findOne({ email: 'admin@mymunc.com' });
    
    if (result) {
      console.log('? Super admin found with email: admin@mymunc.com');
      console.log('Record structure:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('? No super admin found with email: admin@mymunc.com');
    }
  } catch (error) {
    console.error('Connection error:', error.message);
  } finally {
    await client.close();
  }
}

queryAdmin();
