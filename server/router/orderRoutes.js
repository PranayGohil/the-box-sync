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
} = require("../controllers/orderController");

const orderRouter = express.Router();

orderRouter.route("/get/:id").get(authMiddleware, getOrderData);

orderRouter.route("/get-active").get(authMiddleware, getActiveOrders);

orderRouter.route("/ordercontroller").post(authMiddleware, orderController);

orderRouter.route("/addcustomer").post(authMiddleware, addCustomer); // Not Used
orderRouter.route("/getcustomerdata/:id").get(authMiddleware, getCustomerData);

orderRouter.route("/get-orders").get(authMiddleware, orderHistory);

orderRouter.route("/dine-in").post(authMiddleware, dineInController);
orderRouter.route("/takeaway").post(authMiddleware, takeawayController);
orderRouter.route("/delivery").post(authMiddleware, deliveryController);

module.exports = orderRouter;
