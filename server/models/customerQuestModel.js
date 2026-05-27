const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerQuestSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  customer_id: { type: Schema.Types.ObjectId, ref: "customer", required: true, index: true },
  quest_id: { type: Schema.Types.ObjectId, ref: "quest", required: true },
  progressCount: { type: Number, default: 0 }, // e.g. "2" desserts out of "3"
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  isRewardRedeemed: { type: Boolean, default: false },
  redeemedAt: { type: Date }
}, { timestamps: true });

customerQuestSchema.index({ customer_id: 1, quest_id: 1 }, { unique: true });

module.exports = mongoose.model("customer_quest", customerQuestSchema);
