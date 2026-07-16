const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const questSchema = new Schema({
  user_id: { type: String, required: true, index: true }, // Tenant
  name: { type: String, required: true }, // e.g., "The Dessert Connoisseur"
  challengeType: { 
    type: String, 
    enum: ["DESSERT", "MIDWEEK", "BREAKFAST", "ADVENTUROUS", "LOYAL", "FEEDBACK"], 
    required: true 
  }, // Category of quest challenge
  targetCount: { type: Number, required: true }, // target visit or order count (e.g. 3 desserts)
  rewardType: { 
    type: String, 
    enum: ["BONUS_POINTS", "FREE_ITEM", "DISCOUNT_PERCENT", "DISCOUNT_CASH"], 
    required: true 
  },
  rewardValue: { type: String, required: true }, // e.g., "100" points, "Free Icecream", "20" percent, etc.
  durationDays: { type: Number, default: 30 }, // Quest duration
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("quest", questSchema);
