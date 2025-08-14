const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const { getDashboardData, getCategoryWiseOrders, getOrderTypeWiseOrders, getRevenueSummary } = require("../controllers/statisticsController");

const statisticsRouter = express.Router();

statisticsRouter.route("/dashboard").get(authMiddleware, getDashboardData);
statisticsRouter.route("/category-wise-orders").get(authMiddleware, getCategoryWiseOrders);
statisticsRouter.route("/order-type-wise-orders").get(authMiddleware, getOrderTypeWiseOrders);
statisticsRouter.route("/revenue-summary").get(authMiddleware, getRevenueSummary);

module.exports = statisticsRouter;