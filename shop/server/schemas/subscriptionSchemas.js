const Joi = require("joi");

const addSubscriptionPlanSchema = Joi.object({
  plan_name: Joi.string().min(2).max(100).required().messages({
    "any.required": "Plan name is required",
  }),
  plan_price: Joi.number().min(0).required().messages({
    "any.required": "Plan price is required",
  }),
  plan_duration: Joi.number().integer().min(1).required().messages({
    "any.required": "Plan duration (in months) is required",
  }),
  features: Joi.array().items(Joi.string()).default([]),
  is_addon: Joi.boolean().default(false),
  compatible_with: Joi.string().hex().length(24).allow(null, "").optional().messages({
    "string.hex": "compatible_with must be a valid MongoDB ObjectId",
  }),
  bundled_plans: Joi.array().items(Joi.string()).default([]),
  max_custom_addons: Joi.number().integer().min(0).default(0),
});

const blockSubscriptionsSchema = Joi.object({
  subscriptionIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required()
    .messages({
      "any.required": "subscriptionIds array is required",
      "array.min": "At least one subscription ID must be provided",
    }),
});

const unblockSubscriptionSchema = Joi.object({
  subscriptionId: Joi.string().hex().length(24).required().messages({
    "any.required": "subscriptionId is required",
    "string.hex": "subscriptionId must be a valid MongoDB ObjectId",
  }),
});

const expandSubscriptionsSchema = Joi.object({
  subscriptionIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required(),
  newEndDate: Joi.date().iso().greater("now").required().messages({
    "date.greater": "newEndDate must be a future date",
    "any.required": "newEndDate is required",
  }),
});

const renewSubscriptionSchema = Joi.object({
  subscriptionId: Joi.string().hex().length(24).required().messages({
    "any.required": "subscriptionId is required",
  }),
});

const buyCompletePlanSchema = Joi.object({
  planType: Joi.string().min(2).max(50).required().messages({
    "any.required": "planType is required (e.g. Core, Growth, Scale)",
  }),
  chosenAddons: Joi.array().items(Joi.string()).default([]),
});

module.exports = {
  addSubscriptionPlanSchema,
  blockSubscriptionsSchema,
  unblockSubscriptionSchema,
  expandSubscriptionsSchema,
  renewSubscriptionSchema,
  buyCompletePlanSchema,
};
