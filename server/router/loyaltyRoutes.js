const express = require("express");
const {
  getLoyaltySettings,
  saveLoyaltySettings,
  getCustomerProfile,
  getActiveQuests,
  createQuest,
  toggleQuestStatus,
  getLoyaltyTransactions,
  triggerAutomatedCampaigns,
  getRetentionCampaigns,
  createRetentionCampaign,
  toggleRetentionCampaignStatus,
  deleteRetentionCampaign,
  validatePromoCode
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

// Dynamic Retention Campaigns
loyaltyRouter.get("/retention-campaigns", authMiddleware, getRetentionCampaigns);
loyaltyRouter.post("/retention-campaigns", authMiddleware, createRetentionCampaign);
loyaltyRouter.put("/retention-campaigns/toggle/:id", authMiddleware, toggleRetentionCampaignStatus);
loyaltyRouter.delete("/retention-campaigns/:id", authMiddleware, deleteRetentionCampaign);
// Promo Code Validation
loyaltyRouter.post("/validate-promo", authMiddleware, validatePromoCode);

module.exports = loyaltyRouter;
