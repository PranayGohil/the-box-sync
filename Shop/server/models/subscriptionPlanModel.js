const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscriptionPlanSchema = new Schema(
  {
    plan_name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    plan_price: {
      type: Number,
      required: true,
    },
    plan_duration: {
      type: Number, // months
      required: true,
      min: 1,
    },
    features: {
      type: [String],
      default: [],
    },
    is_addon: {
      type: Boolean,
      default: false,
      index: true,
    },
    compatible_with: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subscriptionPlan", // or String, depending on your design
      default: null,
      index: true,
    },
    bundled_plans: {
      type: [String], // Array of plan_names that are included in this bundle
      default: [],
    },
    max_custom_addons: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const SubscriptionPlan = mongoose.model(
  "subscriptionPlan",
  subscriptionPlanSchema
);
module.exports = SubscriptionPlan;
