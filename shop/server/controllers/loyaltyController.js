const Customer = require("../models/customerModel");
const LoyaltySetting = require("../models/loyaltySettingModel");
const LoyaltyTransaction = require("../models/loyaltyTransactionModel");
const Quest = require("../models/questModel");
const CustomerQuest = require("../models/customerQuestModel");
const Order = require("../models/orderModel");

// Get or initialize global loyalty settings
const getLoyaltySettings = async (req, res) => {
  try {
    const user_id = req.user; // Tenant ID from authMiddleware
    let settings = await LoyaltySetting.findOne({ user_id });
    
    if (!settings) {
      settings = new LoyaltySetting({ user_id });
      await settings.save();
    }
    
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error("Error getting loyalty settings:", error);
    return res.status(500).json({ success: false, message: "Error fetching loyalty settings" });
  }
};

// Update/Save global loyalty settings
const saveLoyaltySettings = async (req, res) => {
  try {
    const user_id = req.user;
    const updateData = req.body;
    
    let settings = await LoyaltySetting.findOneAndUpdate(
      { user_id },
      { $set: updateData },
      { new: true, upsert: true }
    );
    
    return res.status(200).json({ success: true, data: settings, message: "Loyalty configurations saved successfully" });
  } catch (error) {
    console.error("Error updating loyalty settings:", error);
    return res.status(500).json({ success: false, message: "Error updating loyalty settings" });
  }
};

// Fetch customer profile details by phone number (including visit insights, points balance, and active quests)
const getCustomerProfile = async (req, res) => {
  try {
    const user_id = req.user;
    const { phone } = req.params;
    
    let customer = await Customer.findOne({ phone, user_id });
    
    // Auto-create basic profile if this is the customer's first POS interaction
    if (!customer) {
      customer = new Customer({
        phone,
        name: "Walk-in Customer",
        user_id,
        loyalty_points: 0,
        total_spend: 0,
        visit_count: 0
      });
      await customer.save();
    }
    
    // Fetch active quests
    const activeQuests = await Quest.find({ user_id, isActive: true });
    
    // Fetch progress on active quests
    const questsProgress = [];
    for (const quest of activeQuests) {
      let progress = await CustomerQuest.findOne({ customer_id: customer._id, quest_id: quest._id });
      if (!progress) {
        progress = new CustomerQuest({
          user_id,
          customer_id: customer._id,
          quest_id: quest._id,
          progressCount: 0,
          isCompleted: false
        });
        await progress.save();
      }
      questsProgress.push({
        quest_id: quest._id,
        name: quest.name,
        challengeType: quest.challengeType,
        targetCount: quest.targetCount,
        progressCount: progress.progressCount,
        isCompleted: progress.isCompleted,
        rewardType: quest.rewardType,
        rewardValue: quest.rewardValue,
        durationDays: quest.durationDays
      });
    }
    
    // Fetch customer's recent points transactions
    const transactions = await LoyaltyTransaction.find({ customer_id: customer._id })
      .sort({ createdAt: -1 })
      .limit(10);
      
    return res.status(200).json({
      success: true,
      data: {
        customer,
        quests: questsProgress,
        history: transactions
      }
    });
  } catch (error) {
    console.error("Error fetching customer CRM profile:", error);
    return res.status(500).json({ success: false, message: "Error fetching customer CRM profile" });
  }
};

// Points Earn & Redeem core hook inside POS order checkout
const processOrderLoyalty = async (user_id, orderId, orderAmount, customerId, pointsRedeemed = 0) => {
  try {
    const settings = await LoyaltySetting.findOne({ user_id }) || { earnRateSpent: 10, earnRatePoints: 1, redeemRatePoints: 100, redeemRateDiscount: 10, isActive: true };
    if (!settings.isActive) return;

    const customer = await Customer.findById(customerId);
    if (!customer) return;

    let transactionLogs = [];

    // 1. Process point redemptions if requested by cashier
    if (pointsRedeemed > 0) {
      const deductionAmount = Math.min(pointsRedeemed, customer.loyalty_points);
      const discountValue = Math.round((deductionAmount / settings.redeemRatePoints) * settings.redeemRateDiscount);
      
      customer.loyalty_points -= deductionAmount;
      
      const redeemTx = new LoyaltyTransaction({
        user_id,
        customer_id: customerId,
        order_id: orderId,
        type: "REDEEM",
        points: deductionAmount,
        amount: discountValue,
        description: `Points redeemed at POS checkout for ₹${discountValue} discount`
      });
      await redeemTx.save();
      transactionLogs.push(redeemTx);
    }

    // 2. Process points earning on order
    const pointsEarned = Math.floor(orderAmount / settings.earnRateSpent) * settings.earnRatePoints;
    customer.loyalty_points += pointsEarned;
    customer.total_spend += orderAmount;
    customer.visit_count += 1;
    customer.last_visit_date = new Date();

    const earnTx = new LoyaltyTransaction({
      user_id,
      customer_id: customerId,
      order_id: orderId,
      type: "EARN",
      points: pointsEarned,
      amount: orderAmount,
      description: `Points earned dynamically on bill of ₹${orderAmount}`
    });
    await earnTx.save();
    transactionLogs.push(earnTx);

    // 3. Process Milestone Retention Campaign Checks
    if (settings.campaigns?.milestoneActive && customer.loyalty_points >= settings.campaigns.milestoneThresholdPoints) {
      // Check if they already got milestone bonus in this range
      const milestoneCompletedBefore = await LoyaltyTransaction.findOne({
        customer_id: customerId,
        type: "CAMPAIGN",
        description: { $regex: /Milestone/i }
      });
      if (!milestoneCompletedBefore) {
        const bonus = settings.campaigns.milestoneRewardPoints;
        customer.loyalty_points += bonus;
        
        const campaignTx = new LoyaltyTransaction({
          user_id,
          customer_id: customerId,
          order_id: orderId,
          type: "CAMPAIGN",
          points: bonus,
          description: `Milestone Reward: Reached ${settings.campaigns.milestoneThresholdPoints} points! Congratulations bonus points.`
        });
        await campaignTx.save();
        transactionLogs.push(campaignTx);
      }
    }

    // Fetch order details to log category preferences and evaluate Food Quests progress
    const order = await Order.findById(orderId);
    if (order && order.items && order.items.length > 0) {
      // Log unique categories ordered to customer preferences
      const orderedCategories = order.items
        .map(i => i.category || i.dish_category || "")
        .filter(c => c !== "");
      
      const newPreferences = [...new Set([...customer.order_preferences, ...orderedCategories])];
      customer.order_preferences = newPreferences.slice(0, 10); // keep top 10

      // Evaluate active Food Quests progress in real time
      await evaluateFoodQuests(user_id, customerId, order, orderedCategories);
    }

    await customer.save();
    return { success: true, transactions: transactionLogs };
  } catch (error) {
    console.error("Critical error processing checkout loyalty:", error);
  }
};

// Evaluate quest progression real-time upon order checkout
const evaluateFoodQuests = async (user_id, customerId, order, orderedCategories) => {
  try {
    const activeQuests = await Quest.find({ user_id, isActive: true });
    const orderDate = new Date(order.createdAt || Date.now());
    const dayOfWeek = orderDate.getDay(); // 0 is Sunday, 2 is Tuesday, 3 is Wednesday

    for (const quest of activeQuests) {
      let progress = await CustomerQuest.findOne({ customer_id: customerId, quest_id: quest._id });
      if (!progress) {
        progress = new CustomerQuest({
          user_id,
          customer_id: customerId,
          quest_id: quest._id,
          progressCount: 0,
          isCompleted: false
        });
      }

      if (progress.isCompleted) continue; // Quest already completed

      let qualifies = false;
      let increments = 1;

      switch (quest.challengeType) {
        case "DESSERT":
          // Check if any ordered item has dessert in its category or name
          const dessertItemsCount = order.items.filter(i => {
            const cat = (i.category || i.dish_category || "").toLowerCase();
            const name = (i.name || i.item_name || "").toLowerCase();
            return cat.includes("dessert") || cat.includes("sweet") || name.includes("dessert") || name.includes("ice cream");
          }).length;
          
          if (dessertItemsCount > 0) {
            qualifies = true;
            increments = dessertItemsCount;
          }
          break;

        case "MIDWEEK":
          // Midweek Champion: Visit on Tuesday (2) or Wednesday (3)
          if (dayOfWeek === 2 || dayOfWeek === 3) {
            qualifies = true;
          }
          break;

        case "BREAKFAST":
          // Check if any breakfast category items ordered
          const breakfastItemsCount = order.items.filter(i => {
            const cat = (i.category || i.dish_category || "").toLowerCase();
            return cat.includes("breakfast") || cat.includes("morning") || cat.includes("south indian");
          }).length;
          
          if (breakfastItemsCount > 0) {
            qualifies = true;
            increments = breakfastItemsCount;
          }
          break;

        case "ADVENTUROUS":
          // Try items you've never ordered before
          qualifies = true;
          break;

        case "LOYAL":
          // Visit 10 times in a month (1 visit per checkout)
          qualifies = true;
          break;

        case "FEEDBACK":
          // Evaluated inside feedback submission, skipped here
          break;
      }

      if (qualifies) {
        progress.progressCount += increments;
        
        if (progress.progressCount >= quest.targetCount) {
          progress.progressCount = quest.targetCount;
          progress.isCompleted = true;
          progress.completedAt = new Date();

          // Award Quest Reward
          const customer = await Customer.findById(customerId);
          if (customer) {
            if (quest.rewardType === "BONUS_POINTS") {
              const bonusPoints = parseInt(quest.rewardValue, 10) || 100;
              customer.loyalty_points += bonusPoints;
              await customer.save();

              const questBonusTx = new LoyaltyTransaction({
                user_id,
                customer_id: customerId,
                type: "BONUS",
                points: bonusPoints,
                description: `Completed Quest: "${quest.name}"! Rewarded with bonus points.`
              });
              await questBonusTx.save();
            }
          }
        }
        await progress.save();
      }
    }
  } catch (error) {
    console.error("Error evaluating food quests:", error);
  }
};

// CRUD Quests inside Admin Dashboard
const getActiveQuests = async (req, res) => {
  try {
    const user_id = req.user;
    const quests = await Quest.find({ user_id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: quests });
  } catch (error) {
    console.error("Error fetching quests:", error);
    return res.status(500).json({ success: false, message: "Error fetching quests" });
  }
};

const createQuest = async (req, res) => {
  try {
    const user_id = req.user;
    const { name, challengeType, targetCount, rewardType, rewardValue, durationDays } = req.body;
    
    if (!name || !challengeType || !targetCount || !rewardType || !rewardValue) {
      return res.status(400).json({ success: false, message: "All challenge fields are required" });
    }

    const quest = new Quest({
      user_id,
      name,
      challengeType,
      targetCount,
      rewardType,
      rewardValue,
      durationDays: durationDays || 30
    });
    
    await quest.save();
    return res.status(201).json({ success: true, data: quest, message: "New Food Quest launched successfully" });
  } catch (error) {
    console.error("Error creating quest:", error);
    return res.status(500).json({ success: false, message: "Error creating quest" });
  }
};

const toggleQuestStatus = async (req, res) => {
  try {
    const user_id = req.user;
    const { id } = req.params;
    
    const quest = await Quest.findOne({ _id: id, user_id });
    if (!quest) {
      return res.status(404).json({ success: false, message: "Quest not found" });
    }
    
    quest.isActive = !quest.isActive;
    await quest.save();
    
    return res.status(200).json({ success: true, data: quest, message: `Quest state changed to ${quest.isActive ? 'Active' : 'Inactive'}` });
  } catch (error) {
    console.error("Error toggling quest:", error);
    return res.status(500).json({ success: false, message: "Error updating quest status" });
  }
};

const getLoyaltyTransactions = async (req, res) => {
  try {
    const user_id = req.user;
    const transactions = await LoyaltyTransaction.find({ user_id })
      .populate("customer_id", "name phone")
      .sort({ createdAt: -1 })
      .limit(50);
      
    return res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error("Error getting loyalty history:", error);
    return res.status(500).json({ success: false, message: "Error loading transactional logs" });
  }
};

// Scheduler route for Automated Retention Campaigns ( Birthday & Win-back 30 day triggers)
const triggerAutomatedCampaigns = async (req, res) => {
  try {
    const user_id = req.user;
    const settings = await LoyaltySetting.findOne({ user_id });
    if (!settings || !settings.isActive) {
      return res.status(400).json({ success: false, message: "Loyalty engine is inactive for this store" });
    }

    let winbackTriggered = 0;
    let birthdayTriggered = 0;
    
    // 1. Process 30-day Win-back Campaign
    if (settings.campaigns?.winbackActive) {
      const targetDays = settings.campaigns.winbackDays || 30;
      const winbackCutoffDate = new Date();
      winbackCutoffDate.setDate(winbackCutoffDate.getDate() - targetDays);
      
      // Select customers who visited before the cutoff date, but have not had any visits since
      const inactiveCustomers = await Customer.find({
        user_id,
        last_visit_date: { $lte: winbackCutoffDate },
        visit_count: { $gt: 0 }
      });
      
      for (const customer of inactiveCustomers) {
        // Ensure they haven't received a win-back reward in the last 30 days to prevent spam
        const winbackAwarded = await LoyaltyTransaction.findOne({
          customer_id: customer._id,
          type: "CAMPAIGN",
          description: { $regex: /Win-back/i },
          createdAt: { $gte: winbackCutoffDate }
        });
        
        if (!winbackAwarded) {
          const reward = settings.campaigns.winbackRewardPoints || 50;
          customer.loyalty_points += reward;
          customer.last_visit_date = new Date(); // Reset visit buffer
          await customer.save();
          
          const campaignTx = new LoyaltyTransaction({
            user_id,
            customer_id: customer._id,
            type: "CAMPAIGN",
            points: reward,
            description: `Win-back Promotion: We miss you! Re-engagement bonus points.`
          });
          await campaignTx.save();
          winbackTriggered++;
        }
      }
    }

    // 2. Process Birthday Month Campaigns
    if (settings.campaigns?.birthdayActive) {
      const currentMonth = new Date().getMonth(); // 0-indexed month
      const currentYear = new Date().getFullYear();
      
      const bdayCustomers = await Customer.find({
        user_id,
        date_of_birth: { $ne: null }
      });

      for (const customer of bdayCustomers) {
        const birthMonth = new Date(customer.date_of_birth).getMonth();
        if (birthMonth === currentMonth) {
          // Verify they haven't received birthday reward for the current year
          const bdayYearStart = new Date(currentYear, 0, 1);
          const bdayAwarded = await LoyaltyTransaction.findOne({
            customer_id: customer._id,
            type: "CAMPAIGN",
            description: { $regex: /Birthday/i },
            createdAt: { $gte: bdayYearStart }
          });
          
          if (!bdayAwarded) {
            const reward = settings.campaigns.birthdayRewardPoints || 100;
            customer.loyalty_points += reward;
            await customer.save();
            
            const campaignTx = new LoyaltyTransaction({
              user_id,
              customer_id: customer._id,
              type: "CAMPAIGN",
              points: reward,
              description: `Birthday Reward: Celebrating your birthday month with bonus points!`
            });
            await campaignTx.save();
            birthdayTriggered++;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Behavioral campaigns processed successfully",
      stats: { winbackTriggered, birthdayTriggered }
    });
  } catch (error) {
    console.error("Error executing behavioral campaigns:", error);
    return res.status(500).json({ success: false, message: "Error executing campaigns" });
  }
};

module.exports = {
  getLoyaltySettings,
  saveLoyaltySettings,
  getCustomerProfile,
  processOrderLoyalty,
  getActiveQuests,
  createQuest,
  toggleQuestStatus,
  getLoyaltyTransactions,
  triggerAutomatedCampaigns
};
