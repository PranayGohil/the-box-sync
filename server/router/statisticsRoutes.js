const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const { getDashboardData } = require("../controllers/statisticsController");

const statisticsRouter = express.Router();

statisticsRouter.route("/dashboard").get(authMiddleware, getDashboardData);

module.exports = statisticsRouter;