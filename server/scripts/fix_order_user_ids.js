/**
 * One-time script to fix orders where user_id was saved as "[object Object]"
 * instead of the actual user ID string.
 *
 * It finds all orders with user_id = "[object Object]", then looks up the
 * correct user_id from the JWT by matching orders to users via panel-user data.
 *
 * Since the manager token encodes the user's _id, we need another way.
 * The simplest fix: look at the user collection, find the user by matching
 * other clues — but since we don't have a direct link, we'll do it a different way:
 *
 * We look at all orders with bad user_id, then look for the user who has
 * matching orders (we can check via related data). The simplest approach is:
 * if there's only one user (restaurant), just fix all bad orders to point to
 * that user's _id. If multiple users exist, we cross-reference via auth tokens.
 *
 * SAFER APPROACH: Print all unique user_ids and let the admin decide.
 * Then fix "[object Object]" entries by looking at the manager user record.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const User = require("../models/userModel");

const MONGODB_URI = process.env.MONGODB_URI.replace(/"/g, "");

async function fixOrderUserIds() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // 1. Find all orders with bad user_id
  const badOrders = await Order.find({ user_id: "[object Object]" }).lean();
  console.log(`Found ${badOrders.length} orders with bad user_id`);

  if (badOrders.length === 0) {
    // Also check for orders with no user_id or empty user_id
    const emptyOrders = await Order.find({ $or: [{ user_id: "" }, { user_id: null }, { user_id: { $exists: false } }] }).lean();
    console.log(`Found ${emptyOrders.length} orders with empty/null user_id`);
    console.log("No bad orders found. Showing all unique user_ids in database:");
    const uniqueIds = await Order.distinct("user_id");
    console.log("Unique user_ids:", uniqueIds);
    await mongoose.disconnect();
    return;
  }

  // 2. Show all unique user_ids for reference
  const allUserIds = await Order.distinct("user_id");
  console.log("\nAll unique user_ids in orders collection:", allUserIds);

  // 3. Get all users from the User collection
  const users = await User.find({}).select("_id name email username").lean();
  console.log("\nAll users in database:");
  users.forEach(u => console.log(`  _id: ${u._id}, name: ${u.name || u.username || u.email}`));

  // 4. If there's exactly one user, fix all bad orders to that user
  if (users.length === 1) {
    const correctUserId = users[0]._id.toString();
    console.log(`\nOnly one user found. Fixing all bad orders to user_id: ${correctUserId}`);
    const result = await Order.updateMany(
      { user_id: "[object Object]" },
      { $set: { user_id: correctUserId } }
    );
    console.log(`Updated ${result.modifiedCount} orders`);
  } else {
    console.log("\nMultiple users found. Cannot automatically fix. Please check which user_id is correct.");
    console.log("Sample bad orders (first 5):");
    badOrders.slice(0, 5).forEach(o => {
      console.log(`  Order _id: ${o._id}, order_source: ${o.order_source}, order_status: ${o.order_status}, customer: ${o.customer_name}`);
    });
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

fixOrderUserIds().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
