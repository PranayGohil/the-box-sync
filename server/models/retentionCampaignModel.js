const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conditionSchema = new Schema({
  field: { type: String, required: true }, // e.g., "TOTAL_SPEND", "VISIT_COUNT", "INACTIVITY_DAYS"
  operator: { type: String, required: true }, // e.g., "GREATER_THAN", "LESS_THAN", "EQUAL"
  value: { type: Number, required: true }
}, { _id: false });

const retentionCampaignSchema = new Schema({
  user_id: { type: String, required: true, index: true }, // Tenant / Restaurant Owner
  name: { type: String, required: true },
  
  // Custom user-defined trigger type label
  triggerType: { type: String, required: true },
  
  // Mode of operation
  isAutomated: { type: Boolean, default: true },
  
  // Rule Definitions
  conditionMatch: { type: String, enum: ["ALL", "ANY"], default: "ALL" },
  conditions: [conditionSchema],
  
  // Rewards
  rewardType: { 
    type: String, 
    enum: ["POINTS", "DISCOUNT_PERCENT", "DISCOUNT_AMOUNT", "FREE_ITEM"], 
    required: true 
  },
  rewardValue: { type: String, required: true }, // String to support Free Item Name, parsable to number for others
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("retention_campaign", retentionCampaignSchema);
