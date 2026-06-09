require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../models/orderModel");

const MONGODB_URI = process.env.MONGODB_URI.replace(/"/g, "");

async function check() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB");

  const userId = "6937b920f45bc0d16bde1cee";
  const order_source = "Manager,Captain";

  const match = {
    user_id: userId,
    $or: [
      { order_status: "KOT" },
      {
        $and: [
          { order_status: "Paid" },
          { "order_items.status": "Preparing" },
        ],
      },
    ],
  };

  if (order_source) {
    const sources = order_source.split(",").map(s => s.trim());
    match.order_source = sources.length > 1 ? { $in: sources } : sources[0];
  }

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        order_items: {
          $filter: {
            input: "$order_items",
            as: "item",
            cond: {
              $or: [
                { $eq: ["$$item.hide_on_kot", false] },
                { $not: ["$$item.hide_on_kot"] } 
              ]
            }
          }
        }
      }
    },
    {
      $match: {
        "order_items": { $elemMatch: { status: { $ne: "Completed" } } },
      },
    },
    { $sort: { "order_date": -1 } },
  ];

  console.log("Running aggregate with pipeline:", JSON.stringify(pipeline, null, 2));

  const orders = await Order.aggregate(pipeline).exec();
  console.log(`\nAggregated orders count: ${orders.length}`);
  
  if (orders.length > 0) {
    orders.forEach(o => {
      console.log(`Order ID: ${o._id}, Status: ${o.order_status}, Source: ${o.order_source}`);
      o.order_items.forEach(item => {
        console.log(`  Item: ${item.dish_name}, Status: ${item.status}, hide_on_kot: ${item.hide_on_kot}`);
      });
    });
  }

  await mongoose.disconnect();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
