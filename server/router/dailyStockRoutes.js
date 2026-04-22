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
} = require("../controllers/dailyStockController");

const dailyStockRouter = express.Router();

// Daily stock snapshots
dailyStockRouter.post("/open", authMiddleware, saveOpeningStock);
dailyStockRouter.post("/close", authMiddleware, saveClosingStock);
dailyStockRouter.get("/today", authMiddleware, getTodayLog);
dailyStockRouter.get("/auto-open", authMiddleware, autoGenerateOpening);
dailyStockRouter.get("/history", authMiddleware, getDailyLogHistory);
dailyStockRouter.put("/:id", authMiddleware, updateDailyLog);

// Wastage
dailyStockRouter.post("/log-wastage", authMiddleware, logWastage);
dailyStockRouter.get("/wastage", authMiddleware, getWastageLog);
dailyStockRouter.delete("/wastage/:id", authMiddleware, deleteWastageLog);

// Threshold / tracking level
dailyStockRouter.put("/item/threshold", authMiddleware, updateItemThreshold);

// Report
dailyStockRouter.get("/report", authMiddleware, getDailyReport);
dailyStockRouter.get("/report/export", authMiddleware, exportDailyReport);

module.exports = dailyStockRouter;
