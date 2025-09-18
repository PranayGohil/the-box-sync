const SubscriptionPlan = require("../models/subscriptionPlanModel");
const Subscription = require("../models/subscriptionModel");
const User = require("../models/userModel");
const cron = require("node-cron");

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
    const subscriptionplan = await SubscriptionPlan.create(req.body);
    res.status(200).json(subscriptionplan);
  } catch (error) {
    console.log(error);
  }
};

const getSubscriptionPlans = async (req, res) => {
  try {
    const subscriptionplans = await SubscriptionPlan.find();
    res.status(200).json(subscriptionplans);
  } catch (error) {
    console.log(error);
  }
};

const getAddonPlans = async (req, res) => {
  try {
    const compatiblePlanId = req.params.id;
    const addonPlans = await SubscriptionPlan.find({
      is_addon: true,
      compatible_with: compatiblePlanId,
    });
    res.status(200).json(addonPlans);
  } catch (error) {
    console.log(error);
  }
};

const getUserSubscriptionInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const subscription = await Subscription.find({ user_id: user._id });
    if (!subscription) {
      return res.status(200).json({ message: "Subscription not found" });
    }
    const today = new Date();
    const updatedSubscriptions = await Promise.all(
      subscription.map(async (sub) => {
        if (new Date(sub.end_date) < today && sub.status !== "inactive") {
          sub.status = "inactive";
          await sub.save();
        }
        return sub;
      })
    );
    res.status(200).json(updatedSubscriptions);
  } catch (error) {
    console.log(error);
  }
};

const getUserSubscriptionInfoById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const subscriptions = await Subscription.find({ user_id: userId });

    res.status(200).json({ user, subscriptions });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const buySubscriptionPlan = async (req, res) => {
  try {
    const planId = req.params.id;
    const userId = req.user;
    console.log("User ID:", req.user);

    if (!userId) {
      console.log("User ID not found in request");
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch plan details
    const planDetails = await SubscriptionPlan.findById(planId);
    if (!planDetails) {
      console.log("Plan not found");
      return res.status(404).json({ message: "Plan not found" });
    }

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + planDetails.plan_duration);

    // Create a new subscription
    const newSubscription = new Subscription({
      user_id: userId,
      plan_id: planDetails._id,
      plan_name: planDetails.plan_name,
      plan_price: planDetails.plan_price,
      start_date: startDate,
      end_date: endDate,
      status: "active",
    });

    // Save the subscription to the database
    const savedSubscription = await newSubscription.save();

    res.status(200).json({
      message: "Subscription purchased successfully",
      subscription: savedSubscription,
    });
  } catch (error) {
    console.error("Error buying subscription:", error);
    res.status(500).json({ error: "Internal server error" });
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
    console.log(req.body);

    if (!subscriptionIds || subscriptionIds.length === 0 || !newEndDate) {
      return res.status(400).json({ message: "Missing subscription data" });
    }

    const result = await Subscription.updateMany(
      { _id: { $in: subscriptionIds } },
      { $set: { end_date: newEndDate, status: "active" } }
    );

    res.status(200).json({ message: "Subscriptions extended", result });
  } catch (error) {
    console.error("Error updating subscriptions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const renewSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    // Find the inactive subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Find the corresponding plan to get duration
    const plan = await SubscriptionPlan.findById(subscription.plan_id);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    // Calculate the new end date
    const newStartDate = new Date(); // Renew from today
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + plan.plan_duration);

    // Update the subscription
    subscription.start_date = newStartDate;
    subscription.end_date = newEndDate;
    subscription.status = "active";
    await subscription.save();

    res.json({ message: "Subscription renewed successfully", subscription });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const buyCompletePlan = async (req, res) => {
  try {
    const userId = req.user;
    const { planType } = req.body; // Expected: "Core", "Growth", or "Scale"
    console.log(userId, planType);
    if (!userId || !planType) {
      return res
        .status(400)
        .json({ success: false, message: "Missing user or plan type." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Define plans for each tier
    const planMapping = {
      Core: ["Manager", "KOT Panel"],
      Growth: [
        "Manager",
        "QSR",
        "Captain Panel",
        "Staff Management",
        "Feedback",
        "Scan For Menu",
        "Restaurant Website",
        "Online Order Reconciliation",
        "Reservation Manager",
        "KOT Panel",
      ],
      Scale: [
        "Manager",
        "QSR",
        "Captain Panel",
        "Staff Management",
        "Feedback",
        "Scan For Menu",
        "Restaurant Website",
        "Online Order Reconciliation",
        "Reservation Manager",
        "Payroll By The Box",
        "Dynamic Reports",
        "KOT Panel",
      ],
    };

    const selectedPlanNames = planMapping[planType];
    if (!selectedPlanNames) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plan type." });
    }

    // Fetch all plan documents
    const selectedPlans = await SubscriptionPlan.find({
      plan_name: { $in: selectedPlanNames },
    });

    if (selectedPlans.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No plans found." });
    }

    const startDate = new Date();
    const createdSubscriptions = [];

    for (const plan of selectedPlans) {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + plan.plan_duration);

      // Check if already subscribed and active
      const existing = await Subscription.findOne({
        user_id: userId,
        plan_id: plan._id,
        status: "active",
      });

      if (!existing) {
        const newSubscription = new Subscription({
          user_id: userId,
          plan_id: plan._id,
          plan_name: plan.plan_name,
          plan_price: plan.plan_price,
          start_date: startDate,
          end_date: endDate,
          status: "active",
        });

        const savedSub = await newSubscription.save();
        createdSubscriptions.push(savedSub);
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { purchasedPlan: planType },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    await updatedUser.save();

    res.status(200).json({
      success: true,
      message: "Plan(s) subscribed successfully.",
      subscriptions: createdSubscriptions,
    });
  } catch (error) {
    console.error("Error in buyCompletePlan:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getAllSubscriptions = async (req, res) => {
  try {
    const users = await User.find({});
    const subscriptions = await Subscription.find({});

    const data = users.map((user) => {
      const userSubscriptions = subscriptions.filter(
        (sub) => sub.user_id === user._id.toString()
      );
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        restaurant_code: user.restaurant_code,
        subscriptions: userSubscriptions,
      };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    res.status(500).json({ error: "Internal server error" });
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
