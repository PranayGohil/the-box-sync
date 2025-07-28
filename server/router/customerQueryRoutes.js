const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
    addCustomerQuery,
    getCustomerQueryByPlanName,
    getCustomerQueryByUserId,
    completeQuery,
} = require("../controllers/customerQueryController");
const adminAuth = require("../middlewares/adminAuth");

const customerQueryRouter = express.Router();

customerQueryRouter.route("/addquery").post(authMiddleware, adminAuth, addCustomerQuery);

customerQueryRouter.route("/get-customer-query/:plan_name").get(authMiddleware, getCustomerQueryByPlanName);

customerQueryRouter.route("/query-user-id/:user_id").get(authMiddleware, getCustomerQueryByUserId);

customerQueryRouter.route("/complete-query").post(authMiddleware, completeQuery); 

module.exports = customerQueryRouter;