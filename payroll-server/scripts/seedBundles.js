require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const SubscriptionPlan = require("../models/subscriptionPlanModel");

const seedBundles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for seeding bundles...");

    const bundles = [
      {
        plan_name: "Core",
        plan_price: 1500, // adjust as needed
        plan_duration: 12,
        is_addon: false,
        bundled_plans: [
          "Manager",
          "Staff Management",
          "Online Order Reconciliation",
        ],
        max_custom_addons: 0,
      },
      {
        plan_name: "Growth",
        plan_price: 3000,
        plan_duration: 12,
        is_addon: false,
        bundled_plans: [
          "Manager",
          "Staff Management",
          "Online Order Reconciliation",
        ],
        max_custom_addons: 6, // Allows picking 6 custom addons
      },
      {
        plan_name: "Scale",
        plan_price: 5000,
        plan_duration: 12,
        is_addon: false,
        bundled_plans: [
          "Manager",
          "Staff Management",
          "Online Order Reconciliation",
          "Reservation Manager",
          "QSR",
          "Captain Panel",
          "KOT Panel",
          "Restaurant Website",
          "Scan For Menu",
          "Feedback",
          "Waiter Calling System",
          "Dynamic Reports",
          "E-Invoice",
          "Payroll By The Box",
        ],
        max_custom_addons: 0,
      },
    ];

    for (const bundle of bundles) {
      const exists = await SubscriptionPlan.findOne({ plan_name: bundle.plan_name });
      if (!exists) {
        await SubscriptionPlan.create(bundle);
        console.log(`✅ Seeded Bundle: ${bundle.plan_name}`);
      } else {
        // Update existing bundle to ensure it has the new fields
        await SubscriptionPlan.updateOne({ plan_name: bundle.plan_name }, { $set: bundle });
        console.log(`✅ Updated existing Bundle: ${bundle.plan_name}`);
      }
    }

    console.log("Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding bundles:", error);
    process.exit(1);
  }
};

seedBundles();
