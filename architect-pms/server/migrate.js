/**
 * Migration Script: Local MongoDB → Atlas
 * Copies all collections from local to Atlas
 */

const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/architect_pms';
const ATLAS_URI = 'mongodb://rushimaru96_db_user:70xyqMm4ZEHnFDQt@ac-pisnzho-shard-00-00.fhrqejy.mongodb.net:27017,ac-pisnzho-shard-00-01.fhrqejy.mongodb.net:27017,ac-pisnzho-shard-00-02.fhrqejy.mongodb.net:27017/architect_pms?ssl=true&replicaSet=atlas-chi93r-shard-0&authSource=admin&retryWrites=true&w=majority';

async function migrate() {
  console.log('=======================================================');
  console.log('   Architect PMS — Database Migration to Atlas');
  console.log('=======================================================');

  let localClient, atlasClient;

  try {
    console.log('\n[1/4] Connecting to Local MongoDB...');
    localClient = new MongoClient(LOCAL_URI);
    await localClient.connect();
    const localDb = localClient.db('architect_pms');
    console.log('      ✓ Connected to Local MongoDB');

    console.log('\n[2/4] Connecting to MongoDB Atlas...');
    atlasClient = new MongoClient(ATLAS_URI);
    await atlasClient.connect();
    const atlasDb = atlasClient.db('architect_pms');
    console.log('      ✓ Connected to Atlas');

    console.log('\n[3/4] Fetching collections...');
    const collections = await localDb.listCollections().toArray();

    if (collections.length === 0) {
      console.log('      ⚠ No collections found in local database.');
    } else {
      console.log(`      Found ${collections.length} collection(s): ${collections.map(c => c.name).join(', ')}`);
    }

    console.log('\n[4/4] Migrating data...');
    let totalDocs = 0;

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const localCol = localDb.collection(colName);
      const atlasCol = atlasDb.collection(colName);

      const docs = await localCol.find({}).toArray();

      if (docs.length === 0) {
        console.log(`      [${colName}] — empty, skipping.`);
        continue;
      }

      // Drop existing data in Atlas collection to avoid duplicates
      await atlasCol.deleteMany({});

      await atlasCol.insertMany(docs);
      totalDocs += docs.length;
      console.log(`      [${colName}] — ✓ ${docs.length} document(s) migrated`);
    }

    console.log('\n=======================================================');
    console.log(`   ✅ Migration complete! ${totalDocs} total document(s) copied.`);
    console.log('=======================================================\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (localClient) await localClient.close();
    if (atlasClient) await atlasClient.close();
  }
}

migrate();
