const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/leaveRequestModel');
const LeaveBalance = require('../models/leaveBalanceModel');
const LeavePolicy = require('../models/leavePolicyModel');
const Staff = require('../models/staffModel');
const authMiddleware = require('../middlewares/auth-middlewares');

// ── Leave Balances ────────────────────────────────────────────────────────────

// Get balances (Admin view gets all, Staff view gets own)
router.get('/balances', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const year = Number(req.query.year) || new Date().getFullYear();

    let query = { user_id: userId, year };
    if (req.user && req.user.Role === 'Staff') {
      query.staff_id = req.user.staff_id;
    } else if (req.query.staff_id) {
      query.staff_id = req.query.staff_id;
    }

    let balances = await LeaveBalance.find(query).populate({
      path: 'staff_id',
      select: 'f_name l_name staff_id position leave_policy_configuration branch_id',
      populate: { path: 'branch_id', select: 'name' }
    });

    // Auto-initialize if no balances found for staff member accessing their own account
    if (balances.length === 0 && req.user && req.user.Role === 'Staff' && req.user.staff_id) {
      const staff_id = req.user.staff_id;
      const staff = await Staff.findById(staff_id).lean();
      const branchId = staff?.branch_id || null;
      let policy = await LeavePolicy.findOne({ user_id: userId, branch_id: branchId });
      if (!policy && branchId) {
        policy = await LeavePolicy.findOne({ user_id: userId, branch_id: null });
      }

      if (policy) {
        const initialBalances = policy.leave_types.map(lt => ({
          leave_type_id: lt.leave_type_id,
          entitled: lt.days_per_year,
          taken: 0,
          pending: 0,
          carried_forward: 0
        }));

        const newBalance = await LeaveBalance.findOneAndUpdate(
          { staff_id, user_id: userId, year },
          { balances: initialBalances },
          { new: true, upsert: true }
        ).populate({
          path: 'staff_id',
          select: 'f_name l_name staff_id position leave_policy_configuration branch_id',
          populate: { path: 'branch_id', select: 'name' }
        });

        balances = [newBalance];
      }
    } else if (balances.length > 0) {
      // Sync balances with current leave policy
      let anyUpdated = false;
      for (const record of balances) {
        let recordUpdated = false;
        
        const branchId = record.staff_id?.branch_id || null;
        let policy = await LeavePolicy.findOne({ user_id: userId, branch_id: branchId });
        if (!policy && branchId) {
          policy = await LeavePolicy.findOne({ user_id: userId, branch_id: null });
        }

        if (policy) {
          // 1. Update existing leave types
          record.balances.forEach(b => {
            const policyType = policy.leave_types.find(lt => lt.leave_type_id === b.leave_type_id);
            if (policyType && b.entitled !== policyType.days_per_year) {
              b.entitled = policyType.days_per_year;
              recordUpdated = true;
            }
          });

          // 2. Add any missing leave types
          policy.leave_types.forEach(pt => {
            const exists = record.balances.find(b => b.leave_type_id === pt.leave_type_id);
            if (!exists) {
              record.balances.push({
                leave_type_id: pt.leave_type_id,
                entitled: pt.days_per_year,
                taken: 0,
                pending: 0,
                carried_forward: 0
              });
              recordUpdated = true;
            }
          });

          if (recordUpdated) {
            record.markModified('balances');
            await record.save();
            anyUpdated = true;
          }
        }
      }
      if (anyUpdated) {
        balances = await LeaveBalance.find(query).populate({
          path: 'staff_id',
          select: 'f_name l_name staff_id position leave_policy_configuration branch_id',
          populate: { path: 'branch_id', select: 'name' }
        });
      }
    }
    // If accessed by staff, filter out disabled leaves from the response
    if (req.user && req.user.Role === 'Staff') {
      balances = balances.map(record => {
        const staff = record.staff_id;
        const config = staff?.leave_policy_configuration || [];
        
        // Return a plain object so we don't modify the mongoose document
        const plainRecord = record.toObject();
        plainRecord.balances = plainRecord.balances.filter(b => {
          const cfg = config.find(c => c.leave_type_id === b.leave_type_id);
          return (cfg && cfg.is_active === true);
        });
        return plainRecord;
      });
    }

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
    
    // Get staff branch
    const staff = await Staff.findById(staff_id).lean();
    const branchId = staff?.branch_id || null;

    // Get policy
    let policy = await LeavePolicy.findOne({ user_id: userId, branch_id: branchId });
    if (!policy && branchId) {
      policy = await LeavePolicy.findOne({ user_id: userId, branch_id: null });
    }
    if (!policy) return res.status(400).json({ success: false, message: "Leave policy not configured" });

    // Build initial balances based on policy
    const balances = policy.leave_types.map(lt => ({
      leave_type_id: lt.leave_type_id,
      entitled: lt.days_per_year,
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

// Get all leave requests (Admin view gets all, Staff view gets own)
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const status = req.query.status; // Optional filter
    
    let query = { user_id: userId };
    if (req.user && req.user.Role === 'Staff') {
      query.staff_id = req.user.staff_id;
    }
    if (status && status !== 'all') query.status = status;

    const requests = await LeaveRequest.find(query)
      .populate({
        path: 'staff_id',
        select: 'f_name l_name staff_id position photo branch_id',
        populate: { path: 'branch_id', select: 'name' }
      })
      .sort({ applied_on: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Apply for leave (Staff applying for themselves, or Admin applying for staff)
router.post('/requests', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    let { staff_id, leave_type_id, from_date, to_date, days, is_half_day, half_day_session, reason } = req.body;

    if (req.user && req.user.Role === 'Staff') {
      staff_id = req.user.staff_id;
    }

    if (!staff_id) {
      return res.status(400).json({ success: false, message: "Staff ID is required" });
    }

    const staff = await Staff.findById(staff_id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }
    
    // Check if the specific leave type is enabled for this staff
    const configList = staff.leave_policy_configuration || [];
    const config = configList.find(c => c.leave_type_id === leave_type_id);
    if (!config || config.is_active === false) {
      return res.status(403).json({ success: false, message: "This specific leave type is currently disabled for your profile." });
    }

    if (!is_half_day) {
      half_day_session = "none";
    }

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

// Approve / Reject Leave (Admin/Manager only)
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
