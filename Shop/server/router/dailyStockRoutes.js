const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  saveOpeningStock,
  saveClosingStock,
  getTodayLog,
  autoGenerateOpening,
  getDailyLogHistory,
  updateDailyLog,
  logWastage,
  getWastageLog,
  deleteWastageLog,
  updateItemThreshold,
  getDailyReport,
  exportDailyReport,
  createCorrectionRequest,
  getCorrectionRequests,
  resolveCorrectionRequest,
  getRestaurantTimings,
  getAIInsights,
} = require("../controllers/dailyStockController");

const dailyStockRouter = express.Router();

// Daily stock snapshots
dailyStockRouter.post("/open", authMiddleware, saveOpeningStock);
dailyStockRouter.post("/close", authMiddleware, saveClosingStock);
dailyStockRouter.get("/today", authMiddleware, getTodayLog);
dailyStockRouter.get("/auto-open", authMiddleware, autoGenerateOpening);
dailyStockRouter.get("/history", authMiddleware, getDailyLogHistory);
dailyStockRouter.get("/timings", authMiddleware, getRestaurantTimings);
dailyStockRouter.put("/:id", authMiddleware, updateDailyLog);

// Correction Requests
dailyStockRouter.post("/correction-request", authMiddleware, createCorrectionRequest);
dailyStockRouter.get("/correction-request", authMiddleware, getCorrectionRequests);
dailyStockRouter.put("/correction-request/:id", authMiddleware, resolveCorrectionRequest);

// Wastage
dailyStockRouter.post("/log-wastage", authMiddleware, logWastage);
dailyStockRouter.get("/wastage", authMiddleware, getWastageLog);
dailyStockRouter.delete("/wastage/:id", authMiddleware, deleteWastageLog);

// Threshold / tracking level
dailyStockRouter.put("/item/threshold", authMiddleware, updateItemThreshold);

// Report
dailyStockRouter.get("/report", authMiddleware, getDailyReport);
dailyStockRouter.get("/report/export", authMiddleware, exportDailyReport);

// AI Insights / Chat Co-pilot
dailyStockRouter.post("/ai-insights", authMiddleware, getAIInsights);

module.exports = dailyStockRouter;
