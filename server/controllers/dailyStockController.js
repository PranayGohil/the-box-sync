const DailyStockLog = require("../models/dailyStockLogModel");
const WastageLog = require("../models/wastageLogModel");
const Inventory = require("../models/inventoryModel");
const StockUsageLog = require("../models/stockUsageLogModel");
const XLSX = require("xlsx");

// ─── Helper: normalize a date to midnight UTC ────────────────────────────────
const toMidnightUTC = (dateInput) => {
  const d = new Date(dateInput || Date.now());
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// ─── Get current live stock per item ─────────────────────────────────────────
const getLiveStock = async (userId) => {
  const stockData = await Inventory.aggregate([
    { $match: { user_id: String(userId), status: "Completed" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.item_name",
        totalStock: { $sum: "$items.currentStock" },
        unit: { $first: "$items.unit" },
        low_stock_threshold: { $max: "$items.low_stock_threshold" },
        tracking_level: { $first: "$items.tracking_level" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return stockData;
};

// ─── POST /daily-stock/open — Save / Update Opening Stock ────────────────────
const saveOpeningStock = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const role = req.user.Role || "Manager";
    const { items, notes, date } = req.body;

    const logDate = toMidnightUTC(date);

    let parsedItems = items;
    if (typeof items === "string") parsedItems = JSON.parse(items);

    const existing = await DailyStockLog.findOne({
      user_id: userId,
      date: logDate,
      shift: "opening",
    });

    // ── Role-based lock ──────────────────────────────────────────────────────
    // Only Admin can edit an already-submitted opening log.
    if (existing && role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Opening stock for today is already submitted. Contact Admin to make corrections.",
      });
    }

    const logData = {
      user_id: userId,
      date: logDate,
      shift: "opening",
      items: parsedItems,
      notes: notes || "",
      log_status: "manager_verified",
      recorded_by: role,
    };

    if (existing) {
      // Admin edit path
      logData.edited_by = role;
      logData.edited_at = new Date();
      const updated = await DailyStockLog.findByIdAndUpdate(existing._id, logData, { new: true });
      return res.json({ success: true, data: updated, updated: true });
    }

    const created = await DailyStockLog.create(logData);
    res.json({ success: true, data: created, updated: false });
  } catch (error) {
    console.error("saveOpeningStock error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── POST /daily-stock/close — Save / Update Closing Stock ──────────────────
const saveClosingStock = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const role = req.user.Role || "Manager";
    const { items, notes, date } = req.body;

    const logDate = toMidnightUTC(date);

    let parsedItems = items;
    if (typeof items === "string") parsedItems = JSON.parse(items);

    const existing = await DailyStockLog.findOne({
      user_id: userId,
      date: logDate,
      shift: "closing",
    });

    // ── Role-based lock ──────────────────────────────────────────────────────
    // Only Admin can edit an already-submitted closing log.
    if (existing && role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Closing stock for today is already submitted. Contact Admin to make corrections.",
      });
    }

    const logData = {
      user_id: userId,
      date: logDate,
      shift: "closing",
      items: parsedItems,
      notes: notes || "",
      log_status: "manager_verified",
      recorded_by: role,
    };

    if (existing) {
      // Admin edit path
      logData.edited_by = role;
      logData.edited_at = new Date();
      const updated = await DailyStockLog.findByIdAndUpdate(existing._id, logData, { new: true });
      return res.json({ success: true, data: updated, updated: true });
    }

    const created = await DailyStockLog.create(logData);
    res.json({ success: true, data: created, updated: false });
  } catch (error) {
    console.error("saveClosingStock error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /daily-stock/today — Today's opening + closing ─────────────────────
const getTodayLog = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const today = toMidnightUTC(new Date());

    const [opening, closing, liveStock] = await Promise.all([
      DailyStockLog.findOne({ user_id: userId, date: today, shift: "opening" }).lean(),
      DailyStockLog.findOne({ user_id: userId, date: today, shift: "closing" }).lean(),
      getLiveStock(userId),
    ]);

    // Build suggestions for opening:
    // If no prev closing, fall back to live stock
    let openingSuggestion = null;
    if (!opening) {
      const yesterday = toMidnightUTC(new Date(Date.now() - 86400000));
      const prevClosing = await DailyStockLog.findOne({
        user_id: userId,
        date: yesterday,
        shift: "closing",
      }).lean();

      openingSuggestion = prevClosing
        ? prevClosing.items
        : liveStock.map((s) => ({ item_name: s._id, unit: s.unit, quantity: s.totalStock }));
    }

    res.json({
      success: true,
      today: today.toISOString().split("T")[0],
      opening,
      closing,
      liveStock,
      openingSuggestion,
    });
  } catch (error) {
    console.error("getTodayLog error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /daily-stock/auto-opening — Auto-generate opening if not done ──────
// Called by cron or manually — creates a "auto_generated" opening from yesterday closing
const autoGenerateOpening = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const today = toMidnightUTC(new Date());
    const yesterday = toMidnightUTC(new Date(Date.now() - 86400000));

    const alreadyExists = await DailyStockLog.findOne({
      user_id: userId,
      date: today,
      shift: "opening",
    });
    if (alreadyExists) {
      return res.json({ success: true, message: "Opening already exists", data: alreadyExists });
    }

    // Try from yesterday's closing
    const prevClosing = await DailyStockLog.findOne({
      user_id: userId,
      date: yesterday,
      shift: "closing",
    }).lean();

    const liveStock = await getLiveStock(userId);
    const items = prevClosing
      ? prevClosing.items
      : liveStock.map((s) => ({ item_name: s._id, unit: s.unit, quantity: s.totalStock }));

    const created = await DailyStockLog.create({
      user_id: userId,
      date: today,
      shift: "opening",
      items,
      log_status: "auto_generated",
      recorded_by: "System",
      notes: "Auto-generated from previous closing stock",
    });

    res.json({ success: true, data: created });
  } catch (error) {
    console.error("autoGenerateOpening error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /daily-stock/history — Paginated daily logs ────────────────────────
const getDailyLogHistory = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { page = 1, limit = 20, from, to } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;

    const query = { user_id: userId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = toMidnightUTC(from);
      if (to) query.date.$lte = toMidnightUTC(to);
    }

    const [data, total] = await Promise.all([
      DailyStockLog.find(query)
        .sort({ date: -1, shift: 1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      DailyStockLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("getDailyLogHistory error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PUT /daily-stock/:id — Edit a submitted daily log ──────────────────────
const updateDailyLog = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const role = req.user.Role || "Manager";
    const { id } = req.params;
    const { items, notes } = req.body;

    let parsedItems = items;
    if (typeof items === "string") parsedItems = JSON.parse(items);

    const updated = await DailyStockLog.findOneAndUpdate(
      { _id: id, user_id: userId },
      {
        items: parsedItems,
        notes,
        log_status: "manager_verified",
        edited_by: role,
        edited_at: new Date(),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Log not found" });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("updateDailyLog error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── POST /daily-stock/log-wastage — Log a wastage event ────────────────────
const logWastage = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const role = req.user.Role || "Manager";
    const { item_name, unit, quantity, wastage_type, reason, date } = req.body;

    if (!item_name || !wastage_type || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: "item_name, wastage_type and positive quantity are required" });
    }

    // Deduct from currentStock
    const requestedAmount = Number(quantity);
    let remainingToDeduct = requestedAmount;

    while (remainingToDeduct > 0) {
      const inv = await Inventory.findOne({
        user_id: userId,
        status: "Completed",
        items: { $elemMatch: { item_name, currentStock: { $gt: 0 } } },
      }).sort({ request_date: 1 });

      if (!inv) break;

      let targetIndex = -1;
      let deductAmount = 0;
      for (let i = 0; i < inv.items.length; i++) {
        if (inv.items[i].item_name === item_name && inv.items[i].currentStock > 0) {
          deductAmount = Math.min(inv.items[i].currentStock, remainingToDeduct);
          targetIndex = i;
          break;
        }
      }

      if (targetIndex === -1 || deductAmount === 0) break;

      const updated = await Inventory.findOneAndUpdate(
        {
          _id: inv._id,
          [`items.${targetIndex}.item_name`]: item_name,
          [`items.${targetIndex}.currentStock`]: { $gte: deductAmount },
        },
        { $inc: { [`items.${targetIndex}.currentStock`]: -deductAmount } },
        { new: true }
      );

      if (updated) remainingToDeduct -= deductAmount;
    }

    // Record wastage log (even if stock was insufficient — partial deduction)
    const logged = await WastageLog.create({
      user_id: userId,
      item_name,
      unit: unit || "",
      quantity: requestedAmount,
      wastage_type,
      reason: reason || "",
      logged_by: role,
      date: date ? new Date(date) : new Date(),
    });

    res.json({ success: true, data: logged, message: "Wastage logged successfully" });
  } catch (error) {
    console.error("logWastage error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /daily-stock/wastage — View wastage history ────────────────────────
const getWastageLog = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { page = 1, limit = 30, from, to, item_name, wastage_type } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 30;

    const query = { user_id: userId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }
    if (item_name) query.item_name = new RegExp(item_name, "i");
    if (wastage_type) query.wastage_type = wastage_type;

    const [data, total] = await Promise.all([
      WastageLog.find(query).sort({ date: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize).lean(),
      WastageLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("getWastageLog error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── DELETE /daily-stock/wastage/:id — Delete a wastage log entry ────────────
const deleteWastageLog = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { id } = req.params;

    const log = await WastageLog.findOne({ _id: id, user_id: userId });
    if (!log) return res.status(404).json({ success: false, message: "Wastage log not found" });

    // Restore stock before deleting
    let remainingToRestore = log.quantity;
    while (remainingToRestore > 0) {
      const inv = await Inventory.findOne({
        user_id: userId,
        status: "Completed",
        "items.item_name": log.item_name,
      }).sort({ request_date: 1 });

      if (!inv) break;

      let targetIndex = -1;
      for (let i = 0; i < inv.items.length; i++) {
        if (inv.items[i].item_name === log.item_name) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex === -1) break;

      const restoreAmount = remainingToRestore;
      await Inventory.findOneAndUpdate(
        { _id: inv._id },
        { $inc: { [`items.${targetIndex}.currentStock`]: restoreAmount } }
      );
      remainingToRestore = 0;
    }

    await WastageLog.deleteOne({ _id: id });
    res.json({ success: true, message: "Wastage log deleted and stock restored" });
  } catch (error) {
    console.error("deleteWastageLog error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PUT /daily-stock/threshold — Update low_stock_threshold for an item ────
const updateItemThreshold = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { item_name, low_stock_threshold, tracking_level } = req.body;

    if (!item_name) {
      return res.status(400).json({ success: false, message: "item_name is required" });
    }

    const updateFields = {};
    if (low_stock_threshold !== undefined) updateFields["items.$[elem].low_stock_threshold"] = Number(low_stock_threshold);
    if (tracking_level) updateFields["items.$[elem].tracking_level"] = tracking_level;

    await Inventory.updateMany(
      { user_id: userId, "items.item_name": item_name },
      { $set: updateFields },
      { arrayFilters: [{ "elem.item_name": item_name }] }
    );

    res.json({ success: true, message: "Item settings updated" });
  } catch (error) {
    console.error("updateItemThreshold error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /daily-stock/report — Full daily inventory report ──────────────────
const getDailyReport = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { from, to } = req.query;

    const fromDate = from ? toMidnightUTC(from) : toMidnightUTC(new Date(Date.now() - 7 * 86400000));
    const toDate = to ? toMidnightUTC(to) : toMidnightUTC(new Date());
    const toDateEnd = new Date(toDate.getTime() + 86400000 - 1);

    // 1. Opening / Closing logs
    const [openings, closings] = await Promise.all([
      DailyStockLog.find({ user_id: userId, shift: "opening", date: { $gte: fromDate, $lte: toDate } }).lean(),
      DailyStockLog.find({ user_id: userId, shift: "closing", date: { $gte: fromDate, $lte: toDate } }).lean(),
    ]);

    // 2. Received stock in range (from Inventory bills)
    const receivedAgg = await Inventory.aggregate([
      {
        $match: {
          user_id: userId,
          status: "Completed",
          bill_date: { $gte: fromDate, $lte: toDateEnd },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.item_name",
          total_received: { $sum: "$items.item_quantity" },
          unit: { $first: "$items.unit" },
          total_value: { $sum: { $multiply: ["$items.item_quantity", { $ifNull: ["$items.item_price", 0] }] } },
        },
      },
    ]);

    // 3. Used stock logs in range
    const usedAgg = await StockUsageLog.aggregate([
      { $match: { user_id: userId, usage_date: { $gte: fromDate, $lte: toDateEnd } } },
      { $group: { _id: "$item_name", total_used: { $sum: "$quantity_used" } } },
    ]);

    // 4. Wastage logs in range
    const wastageAgg = await WastageLog.aggregate([
      { $match: { user_id: userId, date: { $gte: fromDate, $lte: toDateEnd } } },
      {
        $group: {
          _id: "$item_name",
          total_wasted: { $sum: "$quantity" },
          by_type: {
            $push: { type: "$wastage_type", qty: "$quantity" },
          },
        },
      },
    ]);

    // 5. Current live stock
    const liveStock = await getLiveStock(userId);

    // 6. Smart Reorder (avg daily usage last 7 days)
    const sevenDaysAgo = toMidnightUTC(new Date(Date.now() - 7 * 86400000));
    const usageLast7 = await StockUsageLog.aggregate([
      { $match: { user_id: userId, usage_date: { $gte: sevenDaysAgo } } },
      { $group: { _id: "$item_name", total: { $sum: "$quantity_used" } } },
    ]);

    // Build reorder suggestions
    const usageMap = {};
    usageLast7.forEach((u) => { usageMap[u._id] = u.total; });

    const reorderSuggestions = liveStock
      .map((s) => {
        const avgDailyUsage = (usageMap[s._id] || 0) / 7;
        const currentStock = s.totalStock;
        const daysUntilStockout = avgDailyUsage > 0 ? Math.floor(currentStock / avgDailyUsage) : null;
        const needsReorder = daysUntilStockout !== null && daysUntilStockout <= 3;
        return {
          item_name: s._id,
          unit: s.unit,
          current_stock: currentStock,
          avg_daily_usage: Math.round(avgDailyUsage * 100) / 100,
          days_until_stockout: daysUntilStockout,
          needs_reorder: needsReorder,
          low_stock_threshold: s.low_stock_threshold,
          is_below_threshold: s.low_stock_threshold > 0 && currentStock < s.low_stock_threshold,
        };
      })
      .filter((s) => s.current_stock >= 0)
      .sort((a, b) => {
        if (a.days_until_stockout === null) return 1;
        if (b.days_until_stockout === null) return -1;
        return a.days_until_stockout - b.days_until_stockout;
      });

    // Build per-item summary
    const allItems = [...new Set([
      ...liveStock.map((s) => s._id),
      ...receivedAgg.map((r) => r._id),
      ...wastageAgg.map((w) => w._id),
    ])];

    const receivedMap = {};
    receivedAgg.forEach((r) => { receivedMap[r._id] = { qty: r.total_received, value: r.total_value, unit: r.unit }; });

    const usedMap2 = {};
    usedAgg.forEach((u) => { usedMap2[u._id] = u.total_used; });

    const wastageMap = {};
    wastageAgg.forEach((w) => { wastageMap[w._id] = w.total_wasted; });

    const liveMap = {};
    liveStock.forEach((s) => { liveMap[s._id] = { qty: s.totalStock, unit: s.unit, threshold: s.low_stock_threshold }; });

    const itemSummary = allItems.map((name) => {
      const received = receivedMap[name]?.qty || 0;
      const used = usedMap2[name] || 0;
      const wasted = wastageMap[name] || 0;
      const current = liveMap[name]?.qty || 0;
      const unit = liveMap[name]?.unit || receivedMap[name]?.unit || "";
      const totalHandled = used + wasted;
      const wastagePercent = totalHandled > 0 ? Math.round((wasted / totalHandled) * 100) : 0;
      return { item_name: name, unit, received, used, wasted, current_stock: current, wastage_percent: wastagePercent };
    }).sort((a, b) => a.item_name.localeCompare(b.item_name));

    // Wastage pattern summary (top wasted items)
    const wastagePattern = itemSummary
      .filter((i) => i.wasted > 0)
      .sort((a, b) => b.wastage_percent - a.wastage_percent)
      .slice(0, 20);

    // Chart data for Admin (purchase vs used vs wasted over time)
    const chartAgg = await Inventory.aggregate([
      { $match: { user_id: userId, status: "Completed", bill_date: { $gte: fromDate, $lte: toDateEnd } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$bill_date" } },
          purchased: { $sum: "$items.item_quantity" },
          purchase_value: { $sum: { $multiply: ["$items.item_quantity", { $ifNull: ["$items.item_price", 0] }] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const usageChartAgg = await StockUsageLog.aggregate([
      { $match: { user_id: userId, usage_date: { $gte: fromDate, $lte: toDateEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$usage_date" } },
          used: { $sum: "$quantity_used" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const wastageChartAgg = await WastageLog.aggregate([
      { $match: { user_id: userId, date: { $gte: fromDate, $lte: toDateEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          wasted: { $sum: "$quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chartUsedMap = {};
    usageChartAgg.forEach((u) => (chartUsedMap[u._id] = u.used));
    const chartWastedMap = {};
    wastageChartAgg.forEach((w) => (chartWastedMap[w._id] = w.wasted));

    const chartData = chartAgg.map((d) => ({
      date: d._id,
      purchased: d.purchased,
      purchase_value: d.purchase_value,
      used: chartUsedMap[d._id] || 0,
      wasted: chartWastedMap[d._id] || 0,
    }));

    res.json({
      success: true,
      period: { from: fromDate, to: toDateEnd },
      summary: {
        total_received: receivedAgg.reduce((s, r) => s + r.total_received, 0),
        total_purchase_value: receivedAgg.reduce((s, r) => s + r.total_value, 0),
        total_used: usedAgg.reduce((s, u) => s + u.total_used, 0),
        total_wasted: wastageAgg.reduce((s, w) => s + w.total_wasted, 0),
        total_current_stock: liveStock.reduce((s, l) => s + l.totalStock, 0),
        low_stock_items: liveStock.filter((l) => l.low_stock_threshold > 0 && l.totalStock < l.low_stock_threshold).length,
      },
      openings,
      closings,
      itemSummary,
      wastagePattern,
      reorderSuggestions,
      chartData,
    });
  } catch (error) {
    console.error("getDailyReport error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /daily-stock/report/export — Export report to Excel ────────────────
const exportDailyReport = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { from, to } = req.query;

    // Re-use the report logic inline for export
    const fakeReq = { user: req.user, query: { from, to } };
    const fakeRes = {
      json: (data) => data,
      status: () => ({ json: (d) => d }),
    };

    const fromDate = from ? toMidnightUTC(from) : toMidnightUTC(new Date(Date.now() - 7 * 86400000));
    const toDate = to ? toMidnightUTC(to) : toMidnightUTC(new Date());
    const toDateEnd = new Date(toDate.getTime() + 86400000 - 1);

    const [receivedAgg, usedAgg, wastageAgg, liveStock] = await Promise.all([
      Inventory.aggregate([
        { $match: { user_id: userId, status: "Completed", bill_date: { $gte: fromDate, $lte: toDateEnd } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.item_name", total_received: { $sum: "$items.item_quantity" }, unit: { $first: "$items.unit" }, total_value: { $sum: { $multiply: ["$items.item_quantity", { $ifNull: ["$items.item_price", 0] }] } } } },
      ]),
      StockUsageLog.aggregate([
        { $match: { user_id: userId, usage_date: { $gte: fromDate, $lte: toDateEnd } } },
        { $group: { _id: "$item_name", total_used: { $sum: "$quantity_used" } } },
      ]),
      WastageLog.aggregate([
        { $match: { user_id: userId, date: { $gte: fromDate, $lte: toDateEnd } } },
        { $group: { _id: "$item_name", total_wasted: { $sum: "$quantity" } } },
      ]),
      getLiveStock(userId),
    ]);

    const receivedMap = {};
    receivedAgg.forEach((r) => { receivedMap[r._id] = { qty: r.total_received, unit: r.unit, value: r.total_value }; });
    const usedMap = {};
    usedAgg.forEach((u) => { usedMap[u._id] = u.total_used; });
    const wastageMap = {};
    wastageAgg.forEach((w) => { wastageMap[w._id] = w.total_wasted; });
    const liveMap = {};
    liveStock.forEach((s) => { liveMap[s._id] = { qty: s.totalStock, unit: s.unit }; });

    const allItems = [...new Set([...liveStock.map((s) => s._id), ...receivedAgg.map((r) => r._id)])];

    const wb = XLSX.utils.book_new();

    // Sheet 1: Item Summary
    const summaryRows = [["Item Name", "Unit", "Received (Period)", "Used (Period)", "Wasted (Period)", "Current Stock", "Wastage %"]];
    allItems.forEach((name) => {
      const received = receivedMap[name]?.qty || 0;
      const used = usedMap[name] || 0;
      const wasted = wastageMap[name] || 0;
      const current = liveMap[name]?.qty || 0;
      const unit = liveMap[name]?.unit || receivedMap[name]?.unit || "";
      const total = used + wasted;
      const wastePct = total > 0 ? Math.round((wasted / total) * 100) : 0;
      summaryRows.push([name, unit, received, used, wasted, current, `${wastePct}%`]);
    });
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1["!cols"] = [{ wch: 30 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Item Summary");

    // Sheet 2: Current Stock
    const stockRows = [["Item Name", "Unit", "Current Stock", "Low Stock Threshold", "Status"]];
    liveStock.forEach((s) => {
      const status = s.low_stock_threshold > 0 && s.totalStock < s.low_stock_threshold ? "⚠ Low Stock" : "OK";
      stockRows.push([s._id, s.unit, s.totalStock, s.low_stock_threshold || "Not set", status]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(stockRows);
    ws2["!cols"] = [{ wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Current Stock");

    // Sheet 3: Wastage Log
    const wastageRows = [["Date", "Item Name", "Unit", "Quantity", "Type", "Reason", "Logged By"]];
    const wastageLogs = await WastageLog.find({ user_id: userId, date: { $gte: fromDate, $lte: toDateEnd } }).sort({ date: -1 }).lean();
    wastageLogs.forEach((w) => {
      wastageRows.push([
        new Date(w.date).toLocaleDateString("en-IN"),
        w.item_name,
        w.unit,
        w.quantity,
        w.wastage_type,
        w.reason || "",
        w.logged_by,
      ]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(wastageRows);
    ws3["!cols"] = [{ wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Wastage Log");

    // Sheet 4: Purchase Bills in period
    const purchaseRows = [["Bill Date", "Vendor", "Category", "Bill Number", "Item Name", "Unit", "Qty", "Price", "Total"]];
    const bills = await Inventory.find({ user_id: userId, status: "Completed", bill_date: { $gte: fromDate, $lte: toDateEnd } }).lean();
    bills.forEach((b) => {
      b.items.forEach((item) => {
        purchaseRows.push([
          b.bill_date ? new Date(b.bill_date).toLocaleDateString("en-IN") : "",
          b.vendor_name || "",
          b.category || "",
          b.bill_number || "",
          item.item_name,
          item.unit,
          item.item_quantity,
          item.item_price || 0,
          (item.item_quantity || 0) * (item.item_price || 0),
        ]);
      });
    });
    const ws4 = XLSX.utils.aoa_to_sheet(purchaseRows);
    ws4["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws4, "Purchase Bills");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const dateStr = `${fromDate.toISOString().split("T")[0]}_to_${toDate.toISOString().split("T")[0]}`;
    res.setHeader("Content-Disposition", `attachment; filename="Inventory_Report_${dateStr}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("exportDailyReport error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
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
};
