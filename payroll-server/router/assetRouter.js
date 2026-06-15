const express = require('express');
const router = express.Router();
const Asset = require('../models/assetModel');
const AssetRequest = require('../models/assetRequestModel');
const authMiddleware = require('../middlewares/auth-middlewares');

// Get all assets for the logged-in user (populating staff/assigned_to)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    let query = { user_id: userId };
    
    if (req.user && req.user.Role === 'Staff') {
      query.assigned_to = req.user.staff_id;
    }

    const assets = await Asset.find(query)
      .populate('assigned_to', 'f_name l_name staff_id')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all asset requests (Admin views all, Staff views own)
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    let query = { user_id: userId };

    if (req.user && req.user.Role === 'Staff') {
      query.staff_id = req.user.staff_id;
    }

    const requests = await AssetRequest.find(query)
      .populate('staff_id', 'f_name l_name staff_id position')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching asset requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create a new asset request
router.post('/requests', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { asset_name, asset_type, reason } = req.body;

    if (!asset_name) {
      return res.status(400).json({ success: false, message: "Asset name is required" });
    }

    let staff_id;
    if (req.user && req.user.Role === 'Staff') {
      staff_id = req.user.staff_id;
    } else {
      staff_id = req.body.staff_id;
      if (!staff_id) {
        return res.status(400).json({ success: false, message: "Staff ID is required" });
      }
    }

    const newRequest = await AssetRequest.create({
      user_id: userId,
      staff_id,
      asset_name,
      asset_type: asset_type || 'other',
      reason: reason || '',
      status: 'pending'
    });

    res.json({ success: true, data: newRequest, message: "Asset request submitted successfully" });
  } catch (error) {
    console.error("Error creating asset request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update asset request status (Admin/Manager only)
router.put('/requests/:id/status', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user);
    const { status, notes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const updated = await AssetRequest.findOneAndUpdate(
      { _id: req.params.id, user_id: userId },
      { status, notes: notes || '' },
      { new: true }
    ).populate('staff_id', 'f_name l_name staff_id position');

    if (!updated) {
      return res.status(404).json({ success: false, message: "Asset request not found" });
    }

    res.json({ success: true, data: updated, message: `Asset request status updated to ${status}` });
  } catch (error) {
    console.error("Error updating asset request status:", error);
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
