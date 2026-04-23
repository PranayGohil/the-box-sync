const express = require('express');
const router = express.Router();
const Holiday = require('../models/holidayModel');
const authMiddleware = require('../middlewares/auth-middlewares'); // Assuming this exists

// Get all holidays for a user & year
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ success: false, message: "Year is required" });
    }

    const holidays = await Holiday.find({ user_id: userId, year: Number(year) }).sort({ date: 1 });
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
