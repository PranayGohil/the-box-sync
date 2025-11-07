const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
    // Revenue
    getRevenueStats,

    // Orders
    getOrderStats,

    // Dishes & Menu
    getTopDishes,
    getCategoryStats,
    getLowPerformingDishes,

    // Customers
    getCustomerStats,

    // Time-based
    getPeakHours,
    getDayOfWeekStats,

    // Comparison
    getComparison,

    // Dashboard
    getOverview,

    // Performance
    getWaiterPerformance,
    getTablePerformance
} = require("../controllers/statisticsController");

const statisticsRouter = express.Router();

// ============================================
// DASHBOARD OVERVIEW
// ============================================
// GET /api/statistics/overview?period=today|yesterday|week|month|year|custom&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/overview", authMiddleware, getOverview);

// ============================================
// REVENUE ANALYTICS
// ============================================
// GET /api/statistics/revenue?period=today|week|month|year&group_by=day|month|hour&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/revenue", authMiddleware, getRevenueStats);

// ============================================
// ORDER ANALYTICS
// ============================================
// GET /api/statistics/orders?period=today|week|month&group_by=type|status|source|payment&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/orders", authMiddleware, getOrderStats);

// ============================================
// DISH & MENU ANALYTICS
// ============================================
// GET /api/statistics/dishes/top?period=week|month|year&limit=10&category=CategoryName&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/dishes/top", authMiddleware, getTopDishes);

// GET /api/statistics/dishes/low-performing?period=month|year&threshold=5&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/dishes/low-performing", authMiddleware, getLowPerformingDishes);

// GET /api/statistics/categories?period=week|month|year&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/categories", authMiddleware, getCategoryStats);

// ============================================
// CUSTOMER ANALYTICS
// ============================================
// GET /api/statistics/customers?period=week|month|year&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/customers", authMiddleware, getCustomerStats);

// ============================================
// TIME-BASED ANALYTICS
// ============================================
// GET /api/statistics/peak-hours?period=week|month&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/peak-hours", authMiddleware, getPeakHours);

// GET /api/statistics/day-of-week?period=month|year&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/day-of-week", authMiddleware, getDayOfWeekStats);

// ============================================
// COMPARISON ANALYTICS
// ============================================
// GET /api/statistics/comparison?metric=revenue|orders|customers&compare=previous_period
statisticsRouter.get("/comparison", authMiddleware, getComparison);

// ============================================
// PERFORMANCE ANALYTICS
// ============================================
// GET /api/statistics/performance/waiters?period=week|month&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/performance/waiters", authMiddleware, getWaiterPerformance);

// GET /api/statistics/performance/tables?period=week|month&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
statisticsRouter.get("/performance/tables", authMiddleware, getTablePerformance);

module.exports = statisticsRouter;