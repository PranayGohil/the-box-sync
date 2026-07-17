const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const loyaltySettingSchema = new Schema({
  user_id: { type: String, required: true, unique: true, index: true }, // Tenant / Restaurant Owner
  earnRateSpent: { type: Number, default: 10 }, // e.g., ₹10 spent
  earnRatePoints: { type: Number, default: 1 },  // = 1 point earned
  redeemRatePoints: { type: Number, default: 100 }, // e.g., 100 points
  redeemRateDiscount: { type: Number, default: 10 },  // = ₹10 off
  isActive: { type: Boolean, default: true },
  
  // Automated Behavioral Retention Campaigns Configuration
  campaigns: {
    winbackActive: { type: Boolean, default: false },
    winbackDays: { type: Number, default: 30 },
    winbackRewardPoints: { type: Number, default: 50 },
    
    birthdayActive: { type: Boolean, default: false },
    birthdayRewardPoints: { type: Number, default: 100 },
    
    milestoneActive: { type: Boolean, default: false },
    milestoneThresholdPoints: { type: Number, default: 500 },
    milestoneRewardPoints: { type: Number, default: 150 },
    
    feedbackActive: { type: Boolean, default: false },
    feedbackRewardPoints: { type: Number, default: 20 }
  }
}, { timestamps: true });

module.exports = mongoose.model("loyalty_setting", loyaltySettingSchema);
