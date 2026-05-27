const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const loyaltyTransactionSchema = new Schema({
  user_id: { type: String, required: true, index: true }, // Tenant
  customer_id: { type: Schema.Types.ObjectId, ref: "customer", required: true, index: true },
  order_id: { type: Schema.Types.ObjectId, ref: "order", default: null },
  type: { type: String, enum: ["EARN", "REDEEM", "BONUS", "CAMPAIGN"], required: true },
  points: { type: Number, required: true },
  amount: { type: Number, default: 0 }, // Order amount or discount cash associated
  description: { type: String }, // e.g., "Points earned on order #1024", "Winback bonus campaign"
}, { timestamps: true });

module.exports = mongoose.model("loyalty_transaction", loyaltyTransactionSchema);
