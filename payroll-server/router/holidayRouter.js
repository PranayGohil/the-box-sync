const express = require('express');
const router = express.Router();
const Holiday = require('../models/holidayModel');
const HolidayInit = require('../models/holidayInitModel');
const authMiddleware = require('../middlewares/auth-middlewares'); // Assuming this exists

// Pre-defined default holidays list mapped by year
const defaultHolidays = {
  2024: [
    { name: "New Year's Day", date: "2024-01-01", holiday_type: "public", is_paid: true },
    { name: "Republic Day", date: "2024-01-26", holiday_type: "national", is_paid: true },
    { name: "Maha Shivaratri", date: "2024-03-08", holiday_type: "public", is_paid: true },
    { name: "Holi", date: "2024-03-25", holiday_type: "public", is_paid: true },
    { name: "Good Friday", date: "2024-03-29", holiday_type: "public", is_paid: true },
    { name: "Id-ul-Fitr", date: "2024-04-11", holiday_type: "public", is_paid: true },
    { name: "May Day / Labour Day", date: "2024-05-01", holiday_type: "public", is_paid: true },
    { name: "Id-ul-Zuha (Bakrid)", date: "2024-06-17", holiday_type: "public", is_paid: true },
    { name: "Muharram", date: "2024-07-17", holiday_type: "public", is_paid: true },
    { name: "Independence Day", date: "2024-08-15", holiday_type: "national", is_paid: true },
    { name: "Janmashtami", date: "2024-08-26", holiday_type: "public", is_paid: true },
    { name: "Mahatma Gandhi's Birthday", date: "2024-10-02", holiday_type: "national", is_paid: true },
    { name: "Dussehra", date: "2024-10-12", holiday_type: "public", is_paid: true },
    { name: "Diwali (Deepavali)", date: "2024-10-31", holiday_type: "public", is_paid: true },
    { name: "Guru Nanak's Birthday", date: "2024-11-15", holiday_type: "public", is_paid: true },
    { name: "Christmas Day", date: "2024-12-25", holiday_type: "public", is_paid: true }
  ],
  2025: [
    { name: "New Year's Day", date: "2025-01-01", holiday_type: "public", is_paid: true },
    { name: "Republic Day", date: "2025-01-26", holiday_type: "national", is_paid: true },
    { name: "Maha Shivaratri", date: "2025-02-26", holiday_type: "public", is_paid: true },
    { name: "Holi", date: "2025-03-14", holiday_type: "public", is_paid: true },
    { name: "Id-ul-Fitr", date: "2025-03-31", holiday_type: "public", is_paid: true },
    { name: "Good Friday", date: "2025-04-18", holiday_type: "public", is_paid: true },
    { name: "May Day / Labour Day", date: "2025-05-01", holiday_type: "public", is_paid: true },
    { name: "Id-ul-Zuha (Bakrid)", date: "2025-06-07", holiday_type: "public", is_paid: true },
    { name: "Muharram", date: "2025-07-06", holiday_type: "public", is_paid: true },
    { name: "Independence Day", date: "2025-08-15", holiday_type: "national", is_paid: true },
    { name: "Janmashtami", date: "2025-08-16", holiday_type: "public", is_paid: true },
    { name: "Milad-un-Nabi", date: "2025-09-05", holiday_type: "public", is_paid: true },
    { name: "Mahatma Gandhi's Birthday", date: "2025-10-02", holiday_type: "national", is_paid: true },
    { name: "Dussehra", date: "2025-10-02", holiday_type: "public", is_paid: true },
    { name: "Diwali (Deepavali)", date: "2025-10-20", holiday_type: "public", is_paid: true },
    { name: "Guru Nanak's Birthday", date: "2025-11-05", holiday_type: "public", is_paid: true },
    { name: "Christmas Day", date: "2025-12-25", holiday_type: "public", is_paid: true }
  ],
  2026: [
    { name: "New Year's Day", date: "2026-01-01", holiday_type: "public", is_paid: true },
    { name: "Republic Day", date: "2026-01-26", holiday_type: "national", is_paid: true },
    { name: "Holi", date: "2026-03-04", holiday_type: "public", is_paid: true },
    { name: "Id-ul-Fitr", date: "2026-03-21", holiday_type: "public", is_paid: true },
    { name: "Good Friday", date: "2026-04-03", holiday_type: "public", is_paid: true },
    { name: "May Day / Labour Day", date: "2026-05-01", holiday_type: "public", is_paid: true },
    { name: "Id-ul-Zuha (Bakrid)", date: "2026-05-27", holiday_type: "public", is_paid: true },
    { name: "Muharram", date: "2026-06-26", holiday_type: "public", is_paid: true },
    { name: "Independence Day", date: "2026-08-15", holiday_type: "national", is_paid: true },
    { name: "Milad-un-Nabi", date: "2026-08-26", holiday_type: "public", is_paid: true },
    { name: "Janmashtami", date: "2026-09-04", holiday_type: "public", is_paid: true },
    { name: "Mahatma Gandhi's Birthday", date: "2026-10-02", holiday_type: "national", is_paid: true },
    { name: "Dussehra", date: "2026-10-20", holiday_type: "public", is_paid: true },
    { name: "Diwali (Deepavali)", date: "2026-11-08", holiday_type: "public", is_paid: true },
    { name: "Guru Nanak's Birthday", date: "2026-11-24", holiday_type: "public", is_paid: true },
    { name: "Christmas Day", date: "2026-12-25", holiday_type: "public", is_paid: true }
  ],
  2027: [
    { name: "New Year's Day", date: "2027-01-01", holiday_type: "public", is_paid: true },
    { name: "Republic Day", date: "2027-01-26", holiday_type: "national", is_paid: true },
    { name: "Holi", date: "2027-03-22", holiday_type: "public", is_paid: true },
    { name: "Good Friday", date: "2027-03-26", holiday_type: "public", is_paid: true },
    { name: "May Day / Labour Day", date: "2027-05-01", holiday_type: "public", is_paid: true },
    { name: "Independence Day", date: "2027-08-15", holiday_type: "national", is_paid: true },
    { name: "Mahatma Gandhi's Birthday", date: "2027-10-02", holiday_type: "national", is_paid: true },
    { name: "Diwali (Deepavali)", date: "2027-10-29", holiday_type: "public", is_paid: true },
    { name: "Christmas Day", date: "2027-12-25", holiday_type: "public", is_paid: true }
  ],
  2028: [
    { name: "New Year's Day", date: "2028-01-01", holiday_type: "public", is_paid: true },
    { name: "Republic Day", date: "2028-01-26", holiday_type: "national", is_paid: true },
    { name: "May Day / Labour Day", date: "2028-05-01", holiday_type: "public", is_paid: true },
    { name: "Independence Day", date: "2028-08-15", holiday_type: "national", is_paid: true },
    { name: "Mahatma Gandhi's Birthday", date: "2028-10-02", holiday_type: "national", is_paid: true },
    { name: "Christmas Day", date: "2028-12-25", holiday_type: "public", is_paid: true }
  ]
};

// Get all holidays for a user & year
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ success: false, message: "Year is required" });
    }

    const targetYear = Number(year);

    // Check if the user has already initialized holidays for this year
    const isInitialized = await HolidayInit.findOne({ user_id: userId, year: targetYear });
    if (!isInitialized) {
      // Fetch default list or fallback list
      let list = defaultHolidays[targetYear];
      if (!list) {
        // Fallback for other years (fixed-date standard holidays)
        list = [
          { name: "New Year's Day", date: `${targetYear}-01-01`, holiday_type: "public", is_paid: true },
          { name: "Republic Day", date: `${targetYear}-01-26`, holiday_type: "national", is_paid: true },
          { name: "May Day / Labour Day", date: `${targetYear}-05-01`, holiday_type: "public", is_paid: true },
          { name: "Independence Day", date: `${targetYear}-08-15`, holiday_type: "national", is_paid: true },
          { name: "Mahatma Gandhi's Birthday", date: `${targetYear}-10-02`, holiday_type: "national", is_paid: true },
          { name: "Christmas Day", date: `${targetYear}-12-25`, holiday_type: "public", is_paid: true }
        ];
      }

      // Format documents to save
      const docs = list.map(item => ({
        user_id: userId,
        name: item.name,
        date: new Date(item.date),
        holiday_type: item.holiday_type,
        is_paid: item.is_paid,
        year: targetYear,
        notes: item.notes || ""
      }));

      // Auto-save the holidays in DB
      if (docs.length > 0) {
        await Holiday.insertMany(docs);
      }

      // Mark this year as initialized for this user
      await HolidayInit.create({ user_id: userId, year: targetYear });
    }

    const holidays = await Holiday.find({ user_id: userId, year: targetYear }).sort({ date: 1 });
    res.json({ success: true, data: holidays });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create a new holiday
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { name, date, holiday_type, is_paid, notes } = req.body;

    if (!name || !date) {
      return res.status(400).json({ success: false, message: "Name and date are required" });
    }

    const d = new Date(date);
    const year = d.getFullYear();

    const newHoliday = await Holiday.create({
      user_id: userId,
      name,
      date: d,
      holiday_type: holiday_type || 'public',
      is_paid: is_paid !== undefined ? is_paid : true,
      year,
      notes: notes || ""
    });

    res.json({ success: true, data: newHoliday, message: "Holiday added successfully" });
  } catch (error) {
    console.error("Error adding holiday:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update a holiday
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { name, date, holiday_type, is_paid, notes } = req.body;
    
    let updateData = { name, holiday_type, is_paid, notes };
    if (date) {
        const d = new Date(date);
        updateData.date = d;
        updateData.year = d.getFullYear();
    }

    const updated = await Holiday.findOneAndUpdate(
      { _id: req.params.id, user_id: userId },
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Holiday not found" });
    }

    res.json({ success: true, data: updated, message: "Holiday updated" });
  } catch (error) {
    console.error("Error updating holiday:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete a holiday
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const deleted = await Holiday.findOneAndDelete({ _id: req.params.id, user_id: userId });
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Holiday not found" });
    }

    res.json({ success: true, message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
