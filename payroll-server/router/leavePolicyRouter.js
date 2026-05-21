const express = require('express');
const router = express.Router();
const LeavePolicy = require('../models/leavePolicyModel');
const authMiddleware = require('../middlewares/auth-middlewares');

// Get leave policy for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    
    let policy = await LeavePolicy.findOne({ user_id: userId });
    
    // Create default if doesn't exist
    if (!policy) {
      policy = await LeavePolicy.create({
        user_id: userId,
        leave_types: [
          {
            leave_type_id: "cl",
            name: "Casual Leave",
            short_code: "CL",
            days_per_year: 12,
            is_paid: true,
            accrual_type: "monthly",
            carry_forward: false
          },
          {
            leave_type_id: "sl",
            name: "Sick Leave",
            short_code: "SL",
            days_per_year: 12,
            is_paid: true,
            accrual_type: "upfront",
            carry_forward: false
          }
        ]
      });
    }

    res.json({ success: true, data: policy });
  } catch (error) {
    console.error("Error fetching leave policy:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update the whole leave policy
router.put('/', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { leave_types } = req.body;

    if (!leave_types || !Array.isArray(leave_types)) {
      return res.status(400).json({ success: false, message: "leave_types array is required" });
    }

    const updated = await LeavePolicy.findOneAndUpdate(
      { user_id: userId },
      { leave_types },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: updated, message: "Leave policy updated successfully" });
  } catch (error) {
    console.error("Error updating leave policy:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
