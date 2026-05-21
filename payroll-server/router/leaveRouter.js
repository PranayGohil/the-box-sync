const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/leaveRequestModel');
const LeaveBalance = require('../models/leaveBalanceModel');
const LeavePolicy = require('../models/leavePolicyModel');
const authMiddleware = require('../middlewares/auth-middlewares');

// ── Leave Balances ────────────────────────────────────────────────────────────

// Get balances for all staff in a year (Admin/Manager view)
router.get('/balances', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const year = Number(req.query.year) || new Date().getFullYear();

    const balances = await LeaveBalance.find({ user_id: userId, year }).populate('staff_id', 'f_name l_name staff_id position');
    res.json({ success: true, data: balances });
  } catch (error) {
    console.error("Error fetching balances:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Initialize balances for a staff member (called on staff creation or year change)
router.post('/balances/init', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { staff_id, year } = req.body;
    
    // Get policy
    const policy = await LeavePolicy.findOne({ user_id: userId });
    if (!policy) return res.status(400).json({ success: false, message: "Leave policy not configured" });

    // Build initial balances based on policy
    const balances = policy.leave_types.map(lt => ({
      leave_type_id: lt.leave_type_id,
      entitled: lt.accrual_type === 'upfront' ? lt.days_per_year : 0, // Monthly will accrue via cron/generation
      taken: 0,
      pending: 0,
      carried_forward: 0
    }));

    const balance = await LeaveBalance.findOneAndUpdate(
      { staff_id, user_id: userId, year },
      { balances },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: balance });
  } catch (error) {
    console.error("Error init balances:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── Leave Requests ────────────────────────────────────────────────────────────

// Get all leave requests (Admin view)
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const status = req.query.status; // Optional filter
    
    let query = { user_id: userId };
    if (status && status !== 'all') query.status = status;

    const requests = await LeaveRequest.find(query)
      .populate('staff_id', 'f_name l_name staff_id position')
      .sort({ applied_on: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Apply for leave (Manager applying for staff, or staff portal)
router.post('/requests', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { staff_id, leave_type_id, from_date, to_date, days, is_half_day, half_day_session, reason } = req.body;

    const newReq = await LeaveRequest.create({
      user_id: userId,
      staff_id,
      leave_type_id,
      from_date: new Date(from_date),
      to_date: new Date(to_date),
      days,
      is_half_day,
      half_day_session,
      reason
    });

    // Update pending balance
    const year = new Date(from_date).getFullYear();
    await LeaveBalance.updateOne(
      { staff_id, year, "balances.leave_type_id": leave_type_id },
      { $inc: { "balances.$.pending": days } }
    );

    res.json({ success: true, data: newReq, message: "Leave applied successfully" });
  } catch (error) {
    console.error("Error applying for leave:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Approve / Reject Leave
router.put('/requests/:id/status', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const role = req.user.Role || 'Admin';
    const { status, rejection_reason } = req.body;

    const leaveReq = await LeaveRequest.findOne({ _id: req.params.id, user_id: userId });
    if (!leaveReq) return res.status(404).json({ success: false, message: "Request not found" });

    // Only process if it was pending
    if (leaveReq.status !== 'pending') {
        return res.status(400).json({ success: false, message: "Leave is already " + leaveReq.status });
    }

    leaveReq.status = status;
    leaveReq.approved_by = role;
    leaveReq.approved_on = new Date();
    if (status === 'rejected') leaveReq.rejection_reason = rejection_reason;
    
    await leaveReq.save();

    // Adjust balances
    const year = new Date(leaveReq.from_date).getFullYear();
    
    if (status === 'approved') {
      // Remove from pending, add to taken
      await LeaveBalance.updateOne(
        { staff_id: leaveReq.staff_id, year, "balances.leave_type_id": leaveReq.leave_type_id },
        { 
          $inc: { "balances.$.pending": -leaveReq.days, "balances.$.taken": leaveReq.days } 
        }
      );
    } else if (status === 'rejected' || status === 'cancelled') {
      // Remove from pending, refund it
      await LeaveBalance.updateOne(
        { staff_id: leaveReq.staff_id, year, "balances.leave_type_id": leaveReq.leave_type_id },
        { 
          $inc: { "balances.$.pending": -leaveReq.days } 
        }
      );
    }

    res.json({ success: true, data: leaveReq, message: `Leave ${status} successfully` });
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
