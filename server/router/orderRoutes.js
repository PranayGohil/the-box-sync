const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const adminAuth = require("../middlewares/adminAuth");
const {
  getOrderData,
  getActiveOrders,
  orderController,
  addCustomer,
  getCustomerData,
  orderHistory,
  dineInController,
  takeawayController,
  deliveryController,
  deliveryFromSiteController,
} = require("../controllers/orderController");

const orderRouter = express.Router();

orderRouter.route("/get/:id").get(authMiddleware, getOrderData);

orderRouter.route("/get-active").post(authMiddleware, getActiveOrders);

orderRouter.route("/ordercontroller").post(authMiddleware, orderController);

orderRouter.route("/addcustomer").post(authMiddleware, addCustomer); // Not Used
orderRouter.route("/getcustomerdata/:id").get(authMiddleware, getCustomerData);

orderRouter.route("/get-orders").get(authMiddleware, orderHistory);

orderRouter.route("/dine-in").post(authMiddleware, dineInController);
orderRouter.route("/takeaway").post(authMiddleware, takeawayController);
orderRouter.route("/delivery").post(authMiddleware, deliveryController);
orderRouter.route("/delivery-from-site/:rescode").post(deliveryFromSiteController);

module.exports = orderRouter;
