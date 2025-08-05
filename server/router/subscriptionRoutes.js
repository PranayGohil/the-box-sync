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
  .route("/addsubscriptionplan")
  .post(authMiddleware, addSubscriptionPlan);
subscriptionRouter
  .route("/get-plans")
  .get(authMiddleware, getSubscriptionPlans);

subscriptionRouter.route("/getaddonplans").get(getAddonPlans);

subscriptionRouter
  .route("/get")
  .get(authMiddleware, getUserSubscriptionInfo);

subscriptionRouter
  .route("/getusersubscriptioninfo/:id")
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
  .route("/buycompleteplan")
  .post(authMiddleware, adminAuth, buyCompletePlan);

subscriptionRouter
  .route("/getallsubscriptions")
  .get(authMiddleware,  getAllSubscriptions);

module.exports = subscriptionRouter;
