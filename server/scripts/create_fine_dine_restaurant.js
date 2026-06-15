require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const User = require("../models/userModel");
const Manager = require("../models/managerModel");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const Subscription = require("../models/subscriptionModel");

const run = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database...");

    const country = "India";
    const country_code = "IN";
    const state = "Gujarat";
    const state_code = "GJ";
    const name = "Fine Dine Palace";
    const email = "finedine@theboxsync.com";
    const password = "password123";
    const username = "finedine_manager";

    // Clean up existing if any
    await User.deleteMany({ email });
    await Manager.deleteMany({ username });

    // Generate restaurant code
    const countryPrefix = country_code.toUpperCase();
    const statePrefix = state_code.toUpperCase();

    const latestUser = await User.findOne({
      country: country,
      state: state,
    })
      .sort({ createdAt: -1 })
      .select("restaurant_code")
      .lean();

    let sequenceNumber = 1;
    if (latestUser && latestUser.restaurant_code) {
      const latestCode = latestUser.restaurant_code;
      const match = latestCode.match(
        new RegExp(`${statePrefix}(\\d+)${countryPrefix}`)
      );
      if (match) {
        sequenceNumber = parseInt(match[1], 10) + 1;
      }
    }

    let restaurantCode;
    let codeExists = true;
    while (codeExists) {
      restaurantCode = `${statePrefix}${String(sequenceNumber).padStart(4, "0")}${countryPrefix}`;
      codeExists = await User.exists({ restaurant_code: restaurantCode });
      if (codeExists) {
        sequenceNumber++;
      }
    }

    console.log("Generated Restaurant Code:", restaurantCode);

    // Create User (restaurant)
    const user = new User({
      restaurant_code: restaurantCode,
      name,
      email,
      password,
      mobile: 9876543210,
      address: "123 Fine Dine Street, Suite A",
      country,
      state,
      city: "Ahmedabad",
      pincode: 380001,
      purchasedPlan: "Fine Dine",
      isApproved: true,
      taxInfo: { cgst: 2.5, sgst: 2.5, vat: 0 },
    });

    await user.save();
    console.log("Created Restaurant User with ID:", user._id);

    // Create Manager
    const manager = new Manager({
      user_id: user._id.toString(),
      username,
      password,
    });
    await manager.save();
    console.log("Created Manager with Username:", username);

    // Create Subscription
    const plan = await SubscriptionPlan.findOne({ plan_name: "Fine Dine" });
    if (!plan) {
      throw new Error("Fine Dine plan not found in database. Run seedNewPlans.js first.");
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1); // 1 year duration

    const subscription = new Subscription({
      user_id: user._id,
      plan_id: plan._id,
      plan_name: plan.plan_name,
      plan_price: plan.plan_price,
      start_date: startDate,
      end_date: endDate,
      status: "active",
    });

    await subscription.save();
    console.log("Created active 'Fine Dine' subscription for the restaurant!");

    console.log("\n========================================");
    console.log("CREATION SUCCESSFUL!");
    console.log("Restaurant Code:", restaurantCode);
    console.log("Manager Username:", username);
    console.log("Manager Password:", password);
    console.log("========================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Error creating Fine Dine Restaurant:", err);
    process.exit(1);
  }
};

run();
