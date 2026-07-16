const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  addSubscriptionPlan,
  getSubscriptionPlans,
  getAddonPlans,
  getUserSubscriptionInfo,
  getUserSubscriptionInfoById,
  buySubscriptionPlan,
  blockSubscriptions,
  unblockSubscription,
  expandSubscriptions,
  renewSubscription,
  buyCompletePlan,
  getAllSubscriptions,
  manualSubscribe
} = require("../controllers/subscriptionController");
const adminAuth = require("../middlewares/adminAuth");
const validate = require("../middlewares/validate");
const {
  addSubscriptionPlanSchema,
  blockSubscriptionsSchema,
  unblockSubscriptionSchema,
  expandSubscriptionsSchema,
  renewSubscriptionSchema,
  buyCompletePlanSchema,
} = require("../schemas/subscriptionSchemas");

const subscriptionRouter = express.Router();

subscriptionRouter
  .route("/add-plan")
  .post(authMiddleware, validate(addSubscriptionPlanSchema), addSubscriptionPlan);
subscriptionRouter
  .route("/get-plans")
  .get(authMiddleware, getSubscriptionPlans);

subscriptionRouter.route("/get-addon").get(getAddonPlans);

subscriptionRouter
  .route("/get")
  .get(authMiddleware, getUserSubscriptionInfo);

subscriptionRouter
  .route("/get/:id")
  .get(authMiddleware, getUserSubscriptionInfoById);

subscriptionRouter
  .route("/buy/:id")
  .post(authMiddleware, buySubscriptionPlan);

subscriptionRouter
  .route("/block")
  .post(authMiddleware, validate(blockSubscriptionsSchema), blockSubscriptions);

subscriptionRouter
  .route("/unblock")
  .post(authMiddleware, validate(unblockSubscriptionSchema), unblockSubscription);

subscriptionRouter
  .route("/expand")
  .post(authMiddleware, validate(expandSubscriptionsSchema), expandSubscriptions);

subscriptionRouter
  .route("/renew")
  .post(authMiddleware, validate(renewSubscriptionSchema), renewSubscription);

subscriptionRouter
  .route("/buy-complete")
  .post(authMiddleware, adminAuth, validate(buyCompletePlanSchema), buyCompletePlan);

subscriptionRouter
  .route("/get-all-subs")
  .get(authMiddleware,  getAllSubscriptions);

subscriptionRouter
  .route("/manual-subscribe")
  .post(authMiddleware, adminAuth, manualSubscribe);

module.exports = subscriptionRouter;
