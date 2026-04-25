const express = require('express');
const router = express.Router();
const SalaryAdvance = require('../models/salaryAdvanceModel');
const authMiddleware = require('../middlewares/auth-middlewares');

// Get all advances (Admin view)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { status } = req.query; // 'active', 'fully_recovered', 'all'
    
    let query = { user_id: userId };
    if (status && status !== 'all') query.status = status;

    const advances = await SalaryAdvance.find(query)
      .populate('staff_id', 'f_name l_name staff_id position')
      .sort({ given_date: -1 });

    res.json({ success: true, data: advances });
  } catch (error) {
    console.error("Error fetching advances:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Give a new advance
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { staff_id, amount, given_date, reason, recovery_mode, installments, notes } = req.body;

    if (!staff_id || !amount || !given_date) {
      return res.status(400).json({ success: false, message: "Staff, Amount, and Date are required" });
    }

    let installmentAmount = amount;
    let numInstallments = 1;

    if (recovery_mode === 'installments') {
        numInstallments = Number(installments) || 1;
        installmentAmount = amount / numInstallments;
    }

    const advance = await SalaryAdvance.create({
      user_id: userId,
      staff_id,
      amount: Number(amount),
      given_date: new Date(given_date),
      reason,
      recovery_mode: recovery_mode || 'single',
      installments: numInstallments,
      installment_amount: installmentAmount,
      notes
    });

    res.json({ success: true, data: advance, message: "Advance recorded successfully" });
  } catch (error) {
    console.error("Error adding advance:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update/Cancel an advance
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { status, notes } = req.body;

    const advance = await SalaryAdvance.findOneAndUpdate(
      { _id: req.params.id, user_id: userId },
      { status, notes },
      { new: true }
    );

    if (!advance) return res.status(404).json({ success: false, message: "Advance not found" });

    res.json({ success: true, data: advance, message: "Advance updated" });
  } catch (error) {
    console.error("Error updating advance:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
