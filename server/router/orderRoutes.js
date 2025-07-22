const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const adminAuth = require("../middlewares/adminAuth");
const {
    getOrderData,
    orderController,
    addCustomer,
    getCustomerData,
    orderHistory
} = require("../controllers/orderController");

const orderRouter = express.Router();


orderRouter
  .route("/getorderdata/:id")
  .get(authMiddleware, getOrderData);
orderRouter
  .route("/ordercontroller")
  .post(authMiddleware, orderController);

orderRouter.route("/addcustomer").post(authMiddleware, addCustomer); // Not Used
orderRouter
  .route("/getcustomerdata/:id")
  .get(authMiddleware, getCustomerData);



orderRouter
  .route("/getorderhistory")
  .get(authMiddleware, orderHistory);

module.exports = orderRouter;