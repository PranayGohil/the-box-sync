require("dotenv").config();
const mongoose = require("mongoose");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;

    // 1. Update subscription plans
    const planUpdateResult = await db.collection("subscriptionplans").updateMany(
      { plan_name: "Create Cashier" },
      { $set: { plan_name: "Cashier" } }
    );
    console.log(`Updated ${planUpdateResult.modifiedCount} plan(s) in subscriptionplans.`);

    // 2. Update user subscriptions
    const subUpdateResult = await db.collection("subscriptions").updateMany(
      { plan_name: "Create Cashier" },
      { $set: { plan_name: "Cashier" } }
    );
    console.log(`Updated ${subUpdateResult.modifiedCount} user subscription(s) in subscriptions.`);

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

run();
