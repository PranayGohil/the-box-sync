const express = require('express');
const router = express.Router();
const Asset = require('../models/assetModel');
const authMiddleware = require('../middlewares/auth-middlewares');

// Get all assets for the logged-in user (populating staff/assigned_to)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const assets = await Asset.find({ user_id: userId })
      .populate('assigned_to', 'f_name l_name staff_id')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create a new asset
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { name, asset_type, serial_number, notes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Asset name is required" });
    }

    const newAsset = await Asset.create({
      user_id: userId,
      name,
      asset_type: asset_type || 'other',
      serial_number: serial_number || '',
      notes: notes || '',
      status: 'available'
    });

    res.json({ success: true, data: newAsset, message: "Asset added successfully" });
  } catch (error) {
    console.error("Error adding asset:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update an asset (including assignments and returns)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { name, asset_type, serial_number, assigned_to, assigned_date, return_date, status, notes } = req.body;

    let updateData = {
      name,
      asset_type,
      serial_number,
      status,
      notes
    };

    // Keep fields defined if they were passed
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (assigned_date !== undefined) updateData.assigned_date = assigned_date;
    if (return_date !== undefined) updateData.return_date = return_date;

    const updated = await Asset.findOneAndUpdate(
      { _id: req.params.id, user_id: userId },
      updateData,
      { new: true }
    ).populate('assigned_to', 'f_name l_name staff_id');

    if (!updated) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    res.json({ success: true, data: updated, message: "Asset updated successfully" });
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete an asset
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const deleted = await Asset.findOneAndDelete({ _id: req.params.id, user_id: userId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    res.json({ success: true, message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
