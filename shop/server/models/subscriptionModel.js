const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      index: true,
      required: true,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subscriptionPlan",
      index: true,
      required: true,
    },
    plan_name: {
      type: String, // keep denormalized copy – good for history
      required: true,
    },
    plan_price: {
      type: Number, // denormalized – also fine
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
      index: true,
    },
    end_date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

// For user-based queries
subscriptionSchema.index({ user_id: 1, status: 1, end_date: 1 });

// For expiry cron job
subscriptionSchema.index({ status: 1, end_date: 1 });

// For “does user already have this plan active?”
subscriptionSchema.index({ user_id: 1, plan_id: 1, status: 1 });

const Subscription = mongoose.model("subscription", subscriptionSchema);
module.exports = Subscription;
