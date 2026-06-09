/**
 * Debug script: check what KOT-eligible orders exist and what
 * user_ids they have, then check what users exist.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const MONGODB_URI = process.env.MONGODB_URI.replace(/"/g, "");
const JWT_SECRET = process.env.JWT_SECRETKEY;

async function debugKOT() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB\n");

  // 1. Show all unique user_ids
  const uniqueUserIds = await Order.distinct("user_id");
  console.log("All unique user_ids in orders:", uniqueUserIds);

  // 2. Show all users
  const users = await User.find({}).select("_id name email username").lean();
  console.log("\nAll users in DB:");
  users.forEach(u => console.log(`  _id: ${u._id}  name: ${u.name || u.username || u.email}`));

  // 3. Show KOT-eligible orders for each user_id
  for (const uid of uniqueUserIds) {
    const kotOrders = await Order.find({
      user_id: uid,
      $or: [
        { order_status: "KOT" },
        { order_status: "Paid", "order_items.status": "Preparing" }
      ]
    }).select("_id order_status order_source order_items.status customer_name").lean();

    console.log(`\nKOT-eligible orders for user_id ${uid}: ${kotOrders.length}`);
    kotOrders.slice(0, 3).forEach(o => {
      console.log(`  _id:${o._id} status:${o.order_status} source:${o.order_source} customer:${o.customer_name}`);
    });

    // Also check all orders for this user
    const allOrders = await Order.find({ user_id: uid }).select("order_status order_source").lean();
    const summary = {};
    allOrders.forEach(o => {
      const key = `${o.order_status}_${o.order_source}`;
      summary[key] = (summary[key] || 0) + 1;
    });
    console.log(`  All orders summary:`, summary);
  }

  // 4. Check if there are any orders with order_source = "Manager"
  const managerOrders = await Order.find({ order_source: "Manager" })
    .select("_id user_id order_status order_source customer_name")
    .lean();
  console.log(`\nAll Manager-source orders: ${managerOrders.length}`);
  managerOrders.slice(0, 5).forEach(o => {
    console.log(`  _id:${o._id} user_id:${o.user_id} status:${o.order_status} customer:${o.customer_name}`);
  });

  await mongoose.disconnect();
  console.log("\nDone.");
}

debugKOT().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
