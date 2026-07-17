const express = require("express");
const {
  getLoyaltySettings,
  saveLoyaltySettings,
  getCustomerProfile,
  getActiveQuests,
  createQuest,
  toggleQuestStatus,
  getLoyaltyTransactions,
  triggerAutomatedCampaigns
} = require("../controllers/loyaltyController");
const authMiddleware = require("../middlewares/auth-middlewares");

const loyaltyRouter = express.Router();

// Loyalty Configurations Settings Routes
loyaltyRouter.get("/settings", authMiddleware, getLoyaltySettings);
loyaltyRouter.post("/settings", authMiddleware, saveLoyaltySettings);

// Loyalty Customer CRM Profile Lookup
loyaltyRouter.get("/customer/:phone", authMiddleware, getCustomerProfile);

// Food Quests Management Routes
loyaltyRouter.get("/quests", authMiddleware, getActiveQuests);
loyaltyRouter.post("/quests", authMiddleware, createQuest);
loyaltyRouter.put("/quests/toggle/:id", authMiddleware, toggleQuestStatus);

// Loyalty History transactional logs
loyaltyRouter.get("/transactions", authMiddleware, getLoyaltyTransactions);

// Manual or Cron trigger for Re-engagement Campaigns
loyaltyRouter.post("/run-campaigns", authMiddleware, triggerAutomatedCampaigns);

module.exports = loyaltyRouter;
