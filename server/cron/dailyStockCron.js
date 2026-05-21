/**
 * dailyStockCron.js
 *
 * Runs every minute — reads each user's open_time_from / open_time_to from
 * WebsiteModel and fires auto-generate jobs at the right per-restaurant time:
 *
 *  • At open_time_from  → auto-generate OPENING stock (if not already done by manager)
 *  • At open_time_to + 60 min → auto-generate CLOSING stock (if not already submitted)
 */

const cron = require('node-cron');
const DailyStockLog = require('../models/dailyStockLogModel');
const Inventory = require('../models/inventoryModel');
const Website = require('../models/WebsiteModel');

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/**
 * Parse "HH:MM" time string → { hours, minutes }
 * Returns null if unparseable.
 */
const parseTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { hours: h, minutes: m };
};

/**
 * Add minutes to a { hours, minutes } object (wraps at 24h).
 */
const addMinutes = ({ hours, minutes }, mins) => {
  const total = hours * 60 + minutes + mins;
  return { hours: Math.floor(total / 60) % 24, minutes: total % 60 };
};

// ─── Auto-generate OPENING stock ─────────────────────────────────────────────

const autoGenerateOpeningForUser = async (userId) => {
  const today = toMidnightUTC(new Date());
  const yesterday = toMidnightUTC(new Date(Date.now() - 86400000));

  // Skip if manager already acted (manager_verified OR already auto_generated)
  const existing = await DailyStockLog.findOne({
    user_id: userId,
    date: today,
    shift: 'opening',
  });
  if (existing) return false; // already exists, skip

  // Build items from yesterday's closing, falling back to live stock
  const prevClosing = await DailyStockLog.findOne({
    user_id: userId,
    date: yesterday,
    shift: 'closing',
  }).lean();

  const liveStock = await getLiveStockForUser(userId);

  const items = prevClosing
    ? prevClosing.items
    : liveStock.map((s) => ({ item_name: s._id, unit: s.unit, quantity: s.totalStock }));

  if (!items || items.length === 0) return false;

  await DailyStockLog.create({
    user_id: userId,
    date: today,
    shift: 'opening',
    items,
    log_status: 'auto_generated',
    recorded_by: 'System',
    notes: 'Auto-generated at restaurant opening time (no manager verification)',
  });

  console.log(`[DailyStockCron] Opening auto-generated for user ${userId}`);
  return true;
};

// ─── Auto-generate CLOSING stock ─────────────────────────────────────────────

const autoGenerateClosingForUser = async (userId) => {
  const today = toMidnightUTC(new Date());

  // Skip if closing already submitted
  const existing = await DailyStockLog.findOne({
    user_id: userId,
    date: today,
    shift: 'closing',
  });
  if (existing) return false;

  // Use current live stock as closing
  const liveStock = await getLiveStockForUser(userId);
  const items = liveStock.map((s) => ({ item_name: s._id, unit: s.unit, quantity: s.totalStock }));

  if (!items || items.length === 0) return false;

  await DailyStockLog.create({
    user_id: userId,
    date: today,
    shift: 'closing',
    items,
    log_status: 'auto_generated',
    recorded_by: 'System',
    notes: 'Auto-recorded 1 hour after restaurant closing time (no manager submission)',
  });

  console.log(`[DailyStockCron] Closing auto-generated for user ${userId}`);
  return true;
};

// ─── Main per-minute job ─────────────────────────────────────────────────────

const runStockCronTick = async () => {
  try {
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();

    // Fetch all websites with timing data
    const websites = await Website.find({
      $or: [
        { open_time_from: { $exists: true, $ne: '' } },
        { open_time_to: { $exists: true, $ne: '' } },
      ],
    }).lean();

    // Also get all distinct user IDs that have inventory (may not have website settings)
    const allInventoryUsers = await Inventory.distinct('user_id', { status: 'Completed' });

    // Build a map: userId → { openTime, closeTime }
    const websiteMap = {};
    websites.forEach((w) => {
      if (w.user_id) {
        websiteMap[String(w.user_id)] = {
          openTime: parseTime(w.open_time_from),
          closeTime: parseTime(w.open_time_to),
        };
      }
    });

    let openingGenerated = 0;
    let closingGenerated = 0;

    for (const userId of allInventoryUsers) {
      const timing = websiteMap[userId] || {};

      // ── Opening auto-generate ──────────────────────────────────────────────
      const openTime = timing.openTime;
      if (openTime && openTime.hours === currentH && openTime.minutes === currentM) {
        const generated = await autoGenerateOpeningForUser(userId);
        if (generated) openingGenerated++;
      }

      // ── Closing auto-generate (1 hour after close time) ───────────────────
      const closeTime = timing.closeTime;
      if (closeTime) {
        const cutoff = addMinutes(closeTime, 60);
        if (cutoff.hours === currentH && cutoff.minutes === currentM) {
          const generated = await autoGenerateClosingForUser(userId);
          if (generated) closingGenerated++;
        }
      }
    }

    if (openingGenerated > 0 || closingGenerated > 0) {
      console.log(
        `[DailyStockCron] Tick: ${openingGenerated} opening(s) auto-generated, ` +
          `${closingGenerated} closing(s) auto-generated.`
      );
    }
  } catch (err) {
    console.error('[DailyStockCron] Error during tick:', err.message);
  }
};

// Run every minute
cron.schedule('* * * * *', () => {
  runStockCronTick();
});

console.log('[DailyStockCron] Started — checking every minute for opening/closing stock transitions.');

module.exports = { autoGenerateOpeningForUser, autoGenerateClosingForUser, runStockCronTick };
