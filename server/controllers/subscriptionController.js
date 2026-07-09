const SubscriptionPlan = require("../models/subscriptionPlanModel");
const Subscription = require("../models/subscriptionModel");
const User = require("../models/userModel");
const cron = require("node-cron");
const { logActivity } = require("../utils/auditLogger");

const updateExpiredSubscriptions = async () => {
  const today = new Date();
  try {
    const result = await Subscription.updateMany(
      { end_date: { $lt: today }, status: { $ne: "inactive" } },
      { $set: { status: "inactive" } }
    );
    console.log(`Updated ${result.modifiedCount} inactive subscriptions`);
  } catch (error) {
    console.error("Error updating subscriptions:", error);
  }
};
cron.schedule("0 0 * * *", () => {
  console.log("Running cron job to update inactive subscriptions...");
  updateExpiredSubscriptions();
});

const addSubscriptionPlan = async (req, res) => {
  try {
    const {
      plan_name,
      plan_price,
      plan_duration,
      features,
      is_addon,
      compatible_with,
    } = req.body;

    if (!plan_name || !plan_price || !plan_duration) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const subscriptionplan = await SubscriptionPlan.create({
      plan_name,
      plan_price,
      plan_duration,
      features,
      is_addon,
      compatible_with: compatible_with || null,
    });

    res.status(201).json({ success: true, data: subscriptionplan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSubscriptionPlans = async (req, res) => {
  try {
    const subscriptionplans = await SubscriptionPlan.find().lean();
    res.status(200).json({ success: true, data: subscriptionplans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAddonPlans = async (req, res) => {
  try {
    const compatiblePlanId = req.params.id;
    const addonPlans = await SubscriptionPlan.find({
      is_addon: true,
      compatible_with: compatiblePlanId,
    }).lean();

    res.status(200).json({ success: true, data: addonPlans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserSubscriptionInfo = async (req, res) => {
  try {
    const userId = req.user._id; // if this is already the _id from JWT

    // Only For Testing Remove in Production and Trust on Cron Job
    // -------------------------------------------------------------
    const today = new Date();
    await Subscription.updateMany(
      {
        user_id: userId,
        end_date: { $lt: today },
        status: { $ne: "inactive" },
      },
      { $set: { status: "inactive" } }
    );
    // -------------------------------------------------------------

    const subscriptions = await Subscription.find({ user_id: userId })
      .sort({ start_date: -1 })
      .lean();

    if (subscriptions.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No subscriptions found", data: [] });
    }

    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    console.error("Error fetching subscription info:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserSubscriptionInfoById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .select("name email mobile restaurant_code isApproved is_street_food")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const subscriptions = await Subscription.find({ user_id: userId })
      .sort({ start_date: -1 })
      .lean();

    res.status(200).json({ success: true, user, subscriptions });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const buySubscriptionPlan = async (req, res) => {
  try {
    const planId = req.params.id;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const planDetails = await SubscriptionPlan.findById(planId);
    if (!planDetails) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Optionally block duplicates:
    const existingActive = await Subscription.findOne({
      user_id: userId,
      plan_id: planDetails._id,
      status: "active",
      end_date: { $gt: new Date() },
    });

    if (existingActive) {
      return res.status(400).json({
        message: "You already have an active subscription for this plan",
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + planDetails.plan_duration);

    const savedSubscription = await Subscription.create({
      user_id: userId,
      plan_id: planDetails._id,
      plan_name: planDetails.plan_name,
      plan_price: planDetails.plan_price,
      start_date: startDate,
      end_date: endDate,
      status: "active",
    });

    res.status(200).json({
      success: true,
      message: "Subscription purchased successfully",
      subscription: savedSubscription,
    });
  } catch (error) {
    console.error("Error buying subscription:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const blockSubscriptions = async (req, res) => {
  try {
    const { subscriptionIds } = req.body;

    if (!subscriptionIds || subscriptionIds.length === 0) {
      return res.status(400).json({ message: "No subscription IDs provided" });
    }

    const result = await Subscription.updateMany(
      { _id: { $in: subscriptionIds } },
      { $set: { status: "blocked" } }
    );

    // Log Activity
    if (req.user.Role === "Super Admin") {
      await logActivity(
        { _id: req.user._id, username: req.user.username },
        "BLOCK_SUBSCRIPTIONS",
        subscriptionIds.join(","),
        { count: result.modifiedCount }
      );
    }

    res.status(200).json({ message: "Subscriptions blocked", result });
  } catch (error) {
    console.error("Error in blocking subscriptions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const unblockSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ message: "No subscription ID provided" });
    }

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    let newStatus = "inactive";

    if (
      !subscription.end_date ||
      new Date(subscription.end_date) > new Date()
    ) {
      newStatus = "active";
    }

    subscription.status = newStatus;
    await subscription.save();

    // Log Activity
    if (req.user.Role === "Super Admin") {
      await logActivity(
        { _id: req.user._id, username: req.user.username },
        "UNBLOCK_SUBSCRIPTION",
        subscriptionId,
        { plan_name: subscription.plan_name, new_status: newStatus }
      );
    }

    res.status(200).json({
      message: `Subscription status updated to ${newStatus}`,
      subscription,
    });
  } catch (error) {
    console.error("Error in unblock subscriptions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const expandSubscriptions = async (req, res) => {
  try {
    const { subscriptionIds, newEndDate } = req.body;

    if (!subscriptionIds || subscriptionIds.length === 0 || !newEndDate) {
      return res.status(400).json({ message: "Missing subscription data" });
    }

    const endDate = new Date(newEndDate);

    const result = await Subscription.updateMany(
      { _id: { $in: subscriptionIds } },
      { $set: { end_date: endDate, status: "active" } }
    );

    // Log Activity
    if (req.user.Role === "Super Admin") {
      await logActivity(
        { _id: req.user._id, username: req.user.username },
        "EXPAND_SUBSCRIPTIONS",
        subscriptionIds.join(","),
        { new_end_date: newEndDate, count: result.modifiedCount }
      );
    }

    res
      .status(200)
      .json({ success: true, message: "Subscriptions extended", result });
  } catch (error) {
    console.error("Error updating subscriptions:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const renewSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const plan = await SubscriptionPlan.findById(subscription.plan_id);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    const newStartDate = new Date();
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + plan.plan_duration);

    subscription.start_date = newStartDate;
    subscription.end_date = newEndDate;
    subscription.status = "active";
    await subscription.save();

    // Log Activity
    if (req.user.Role === "Super Admin") {
      await logActivity(
        { _id: req.user._id, username: req.user.username },
        "RENEW_SUBSCRIPTION",
        subscriptionId,
        { plan_name: plan.plan_name, duration: plan.plan_duration }
      );
    }

    res.json({
      success: true,
      message: "Subscription renewed successfully",
      subscription,
    });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const buyCompletePlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planType, chosenAddons = [] } = req.body;

    if (!userId || !planType) {
      return res
        .status(400)
        .json({ success: false, message: "Missing user or plan type." });
    }

    const user = await User.findById(userId).select("_id").lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Fetch the bundle definition from the database
    const bundlePlan = await SubscriptionPlan.findOne({ plan_name: planType }).lean();

    if (!bundlePlan) {
      return res.status(404).json({ success: false, message: `Bundle '${planType}' not found in database.` });
    }

    let selectedPlanNames = [...(bundlePlan.bundled_plans || [])];

    // If the bundle supports custom addons (like "Growth"), validate and append them
    if (bundlePlan.max_custom_addons > 0 && chosenAddons.length > 0) {
      // Fetch valid addons from the DB to prevent injecting fake plan names
      const validAddonsInDb = await SubscriptionPlan.find({ is_addon: true }).select("plan_name").lean();
      const validAddonNames = validAddonsInDb.map(p => p.plan_name);

      const filteredAddons = chosenAddons
        .filter(addon => validAddonNames.includes(addon))
        .slice(0, bundlePlan.max_custom_addons);

      selectedPlanNames = [...selectedPlanNames, ...filteredAddons];
    }

    const selectedPlans = await SubscriptionPlan.find({
      plan_name: { $in: selectedPlanNames },
    }).lean();

    if (selectedPlans.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No plans found." });
    }

    const planIds = selectedPlans.map((p) => p._id);

    const existingActive = await Subscription.find({
      user_id: userId,
      plan_id: { $in: planIds },
      status: "active",
      end_date: { $gt: new Date() },
    }).select("plan_id");

    const existingPlanIds = new Set(
      existingActive.map((s) => s.plan_id.toString())
    );

    const startDate = new Date();
    const subsToCreate = selectedPlans
      .filter((plan) => !existingPlanIds.has(plan._id.toString()))
      .map((plan) => {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + plan.plan_duration);
        return {
          user_id: userId,
          plan_id: plan._id,
          plan_name: plan.plan_name,
          plan_price: plan.plan_price,
          start_date: startDate,
          end_date: endDate,
          status: "active",
        };
      });

    const createdSubscriptions =
      subsToCreate.length > 0
        ? await Subscription.insertMany(subsToCreate)
        : [];

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { purchasedPlan: planType },
      { new: true }
    ).lean();

    res.status(200).json({
      success: true,
      message: "Plan(s) subscribed successfully.",
      subscriptions: createdSubscriptions,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in buyCompletePlan:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getAllSubscriptions = async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id name email mobile restaurant_code isApproved is_street_food")
      .lean();
    const subscriptions = await Subscription.find({}).lean();

    const subsByUser = subscriptions.reduce((acc, sub) => {
      const key = sub.user_id.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(sub);
      return acc;
    }, {});

    const data = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      restaurant_code: user.restaurant_code,
      isApproved: user.isApproved,
      is_street_food: user.is_street_food,
      subscriptions: subsByUser[user._id.toString()] || [],
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  addSubscriptionPlan,
  getSubscriptionPlans,
  getAddonPlans,
  getUserSubscriptionInfo,
  getUserSubscriptionInfoById,
  buySubscriptionPlan,
  blockSubscriptions,
  unblockSubscription,
  expandSubscriptions,
  renewSubscription,
  buyCompletePlan,
  getAllSubscriptions,
};
