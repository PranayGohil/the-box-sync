/**
 * One-time migration script:
 * Deletes all orders that have no order_no (null, undefined, or empty string).
 *
 * Run with: node scripts/delete-orders-without-order-no.js
 * Confirm delete: node scripts/delete-orders-without-order-no.js --confirm
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/orderModel');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

async function run() {
  if (!MONGO_URI) {
    console.error('❌ No MongoDB URI found. Check your .env file (MONGODB_URI / MONGO_URI / DATABASE_URL).');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // Build the filter: order_no is null, undefined, or empty string
  const filter = {
    $or: [
      { order_no: { $exists: false } },
      { order_no: null },
      { order_no: '' },
    ],
  };

  // --- DRY RUN: count first ---
  const count = await Order.countDocuments(filter);
  console.log(`🔍 Found ${count} orders without an order_no.`);

  if (count === 0) {
    console.log('✅ Nothing to delete. Database is clean.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Ask for confirmation via command-line argument
  const confirmed = process.argv.includes('--confirm');
  if (!confirmed) {
    console.log('\n⚠️  DRY RUN only. No records have been deleted.');
    console.log('   To actually delete, re-run with the --confirm flag:');
    console.log('   node scripts/delete-orders-without-order-no.js --confirm\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  // --- ACTUAL DELETE ---
  console.log('\n🗑️  Deleting...');
  const result = await Order.deleteMany(filter);
  console.log(`✅ Deleted ${result.deletedCount} orders without order_no.`);

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB. Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
