/**
 * dailyStockCron.js
 * Runs at 7:00 AM daily (1 hour after typical 6 AM restaurant opening).
 * Auto-generates opening stock from yesterday's closing for all users.
 */

const cron = require('node-cron');
const DailyStockLog = require('../models/dailyStockLogModel');
const Inventory = require('../models/inventoryModel');

const toMidnightUTC = (dateInput) => {
  const d = new Date(dateInput || Date.now());
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getLiveStockForUser = async (userId) => {
  return await Inventory.aggregate([
    { $match: { user_id: String(userId), status: 'Completed' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.item_name',
        totalStock: { $sum: '$items.currentStock' },
        unit: { $first: '$items.unit' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const autoGenerateOpeningForAllUsers = async () => {
  try {
    const today = toMidnightUTC(new Date());
    const yesterday = toMidnightUTC(new Date(Date.now() - 86400000));

    // Get all distinct user_ids that have inventory
    const userIds = await Inventory.distinct('user_id', { status: 'Completed' });

    let generated = 0;
    let skipped = 0;

    for (const userId of userIds) {
      // Skip if opening already exists for today
      const existing = await DailyStockLog.findOne({
        user_id: userId,
        date: today,
        shift: 'opening',
      });

      if (existing) { skipped++; continue; }

      // Try from yesterday's closing first
      const prevClosing = await DailyStockLog.findOne({
        user_id: userId,
        date: yesterday,
        shift: 'closing',
      }).lean();

      const liveStock = await getLiveStockForUser(userId);

      const items = prevClosing
        ? prevClosing.items
        : liveStock.map((s) => ({ item_name: s._id, unit: s.unit, quantity: s.totalStock }));

      if (!items || items.length === 0) continue;

      await DailyStockLog.create({
        user_id: userId,
        date: today,
        shift: 'opening',
        items,
        log_status: 'auto_generated',
        recorded_by: 'System',
        notes: 'Auto-generated 1 hour after restaurant opening',
      });

      generated++;
    }

    console.log(`[DailyStockCron] Auto-opening: ${generated} generated, ${skipped} already existed.`);
  } catch (err) {
    console.error('[DailyStockCron] Error during auto-generation:', err.message);
  }
};

// Run at 07:00 AM every day (IST = UTC 01:30, but cron runs in server timezone)
// Adjust the hour to match your server timezone. If server is UTC, use '30 1 * * *' for 7 AM IST.
cron.schedule('0 7 * * *', () => {
  console.log('[DailyStockCron] Running auto-opening stock generation at 7:00 AM...');
  autoGenerateOpeningForAllUsers();
});

console.log('[DailyStockCron] Started — auto-generates opening stock at 7:00 AM daily.');

module.exports = { autoGenerateOpeningForAllUsers };
