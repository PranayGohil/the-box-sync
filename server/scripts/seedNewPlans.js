require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const Subscription = require("../models/subscriptionModel");

const seedNewPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for seeding plans & bundles...");

    // 1. Seed/Update standard individual plans (addons and base)
    const individualPlans = [
      { plan_name: "Manager", plan_price: 500, plan_duration: 12, is_addon: false, features: ["Manage Staff", "Track Orders"] },
      { plan_name: "QSR", plan_price: 300, plan_duration: 12, is_addon: true, features: ["Fast Checkout", "Inventory Management"] },
      { plan_name: "Captain Panel", plan_price: 100, plan_duration: 12, is_addon: true, features: ["Table Management", "Order Serving"] },
      { plan_name: "Staff Management", plan_price: 100, plan_duration: 12, is_addon: true, features: ["Staff Attendance", "Shift Management"] },
      { plan_name: "Feedback", plan_price: 100, plan_duration: 12, is_addon: true, features: ["QR-based Feedback"] },
      { plan_name: "Scan For Menu", plan_price: 100, plan_duration: 12, is_addon: true, features: ["Scan and QR Order"] },
      { plan_name: "Restaurant Website", plan_price: 100, plan_duration: 12, is_addon: true, features: ["Restaurant website"] },
      { plan_name: "Online Order Reconciliation", plan_price: 100, plan_duration: 12, is_addon: true, features: ["Online order reconciliation"] },
      { plan_name: "Reservation Manager", plan_price: 100, plan_duration: 12, is_addon: true, features: ["Reservation management"] },
      { plan_name: "Payroll By The Box", plan_price: 100, plan_duration: 12, is_addon: true, features: ["TheBoxSync Payroll"] },
      { plan_name: "Dynamic Reports", plan_price: 100, plan_duration: 12, is_addon: true, features: ["Dynamic Reports"] },
      { plan_name: "KOT Panel", plan_price: 100, plan_duration: 12, is_addon: true, features: ["Kitchen Display System"] },
      { plan_name: "Waiter Calling System", plan_price: 100, plan_duration: 12, is_addon: true, features: ["Waiter calling system"] },
      { plan_name: "Token Management", plan_price: 100, plan_duration: 12, is_addon: true, features: ["Token management"] },
      { plan_name: "Whatsapp-Invoice", plan_price: 100, plan_duration: 12, is_addon: true, features: ["WhatsApp Invoice"] }
    ];

    for (const plan of individualPlans) {
      await SubscriptionPlan.updateOne(
        { plan_name: plan.plan_name },
        { $set: plan },
        { upsert: true }
      );
      console.log(`✅ Upserted Individual Plan: ${plan.plan_name}`);
    }

    // Delete old bundles (Core, Growth, Scale)
    await SubscriptionPlan.deleteMany({
      plan_name: { $in: ["Core", "Growth", "Scale"] }
    });
    console.log("🗑️ Deleted old bundle plans (Core, Growth, Scale).");

    // 2. Seed the 5 new bundles
    const bundles = [
      {
        plan_name: "QSR",
        plan_price: 8000,
        plan_duration: 12,
        is_addon: false,
        max_custom_addons: 0,
        bundled_plans: [
          "Staff Management",
          "Online Order Reconciliation",
          "QSR",
          "KOT Panel",
          "Token Management",
          "Scan For Menu",
          "Feedback",
          "Dynamic Reports",
          "Whatsapp-Invoice"
        ]
      },
      {
        plan_name: "Café",
        plan_price: 10000,
        plan_duration: 12,
        is_addon: false,
        max_custom_addons: 0,
        bundled_plans: [
          "Staff Management",
          "Online Order Reconciliation",
          "QSR",
          "KOT Panel",
          "Token Management",
          "Scan For Menu",
          "Feedback",
          "Dynamic Reports",
          "Whatsapp-Invoice",
          "Restaurant Website"
        ]
      },
      {
        plan_name: "Fine Dine",
        plan_price: 16000,
        plan_duration: 12,
        is_addon: false,
        max_custom_addons: 0,
        bundled_plans: [
          "Manager",
          "Staff Management",
          "Online Order Reconciliation",
          "QSR",
          "Captain Panel",
          "KOT Panel",
          "Reservation Manager",
          "Scan For Menu",
          "Feedback",
          "Waiter Calling System",
          "Dynamic Reports",
          "Whatsapp-Invoice",
          "Restaurant Website"
        ]
      },
      {
        plan_name: "Cloud",
        plan_price: 10000,
        plan_duration: 12,
        is_addon: false,
        max_custom_addons: 0,
        bundled_plans: [
          "Staff Management",
          "Online Order Reconciliation",
          "QSR",
          "KOT Panel",
          "Feedback",
          "Dynamic Reports",
          "Whatsapp-Invoice",
          "Restaurant Website"
        ]
      },
      {
        plan_name: "Chain",
        plan_price: 24000,
        plan_duration: 12,
        is_addon: false,
        max_custom_addons: 0,
        bundled_plans: [
          "Manager",
          "Staff Management",
          "Online Order Reconciliation",
          "QSR",
          "Captain Panel",
          "KOT Panel",
          "Reservation Manager",
          "Token Management",
          "Scan For Menu",
          "Feedback",
          "Waiter Calling System",
          "Dynamic Reports",
          "Whatsapp-Invoice",
          "Restaurant Website",
          "Payroll By The Box"
        ]
      }
    ];

    for (const bundle of bundles) {
      await SubscriptionPlan.updateOne(
        { plan_name: bundle.plan_name },
        { $set: bundle },
        { upsert: true }
      );
      console.log(`✅ Upserted New Bundle: ${bundle.plan_name}`);
    }

    // Delete old Kitchen Display System plan and subscription records
    await SubscriptionPlan.deleteMany({ plan_name: "Kitchen Display System" });
    await Subscription.deleteMany({ plan_name: "Kitchen Display System" });
    console.log("🗑️ Cleaned up Kitchen Display System records from DB.");

    console.log("Seeding complete successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding new plans & bundles:", error);
    process.exit(1);
  }
};

seedNewPlans();
