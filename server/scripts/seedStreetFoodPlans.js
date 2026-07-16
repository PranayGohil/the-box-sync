require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const SubscriptionPlan = require("../models/subscriptionPlanModel");

const seedStreetFoodPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for seeding street food plans...");

    // 1. Update all existing plans to have applicable_to: "restaurant" if not set
    const updateRes = await SubscriptionPlan.updateMany(
      { applicable_to: { $exists: false } },
      { $set: { applicable_to: "restaurant" } }
    );
    console.log(`Updated ${updateRes.modifiedCount} existing plans to 'restaurant'`);

    // 2. Seed street food plans
    const streetFoodPlans = [
      {
        plan_name: "Basic Plan",
        plan_price: 0,
        plan_duration: 12,
        is_addon: false,
        applicable_to: "street-food",
        features: ["Billing operations", "Dish Management", "Inventory Management", "Print configurations"],
      },
      {
        plan_name: "Basic CRM - Monthly",
        plan_price: 59,
        plan_duration: 1,
        is_addon: true,
        applicable_to: "street-food",
        features: ["CRM campaigns", "Customer Relationship Management"],
      },
      {
        plan_name: "Basic CRM - Yearly",
        plan_price: 599,
        plan_duration: 12,
        is_addon: true,
        applicable_to: "street-food",
        features: ["CRM campaigns", "Customer Relationship Management"],
      },
    ];

    for (const plan of streetFoodPlans) {
      await SubscriptionPlan.updateOne(
        { plan_name: plan.plan_name },
        { $set: plan },
        { upsert: true }
      );
      console.log(`✅ Upserted street-food plan: ${plan.plan_name}`);
    }

    console.log("Street food plans seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding street food plans:", error);
    process.exit(1);
  }
};

seedStreetFoodPlans();
