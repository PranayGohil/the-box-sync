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
} = require("../controllers/subscriptionController");
const adminAuth = require("../middlewares/adminAuth");

const subscriptionRouter = express.Router();

subscriptionRouter
  .route("/add-plan")
  .post(authMiddleware, addSubscriptionPlan);
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
  .post(authMiddleware, blockSubscriptions);

subscriptionRouter
  .route("/unblock")
  .post(authMiddleware, unblockSubscription);

subscriptionRouter
  .route("/expand")
  .post(authMiddleware, expandSubscriptions);

subscriptionRouter
  .route("/renew")
  .post(authMiddleware, renewSubscription);

subscriptionRouter
  .route("/buy-complete")
  .post(authMiddleware, adminAuth, buyCompletePlan);

subscriptionRouter
  .route("/get-all-subs")
  .get(authMiddleware,  getAllSubscriptions);

module.exports = subscriptionRouter;
