const Shift = require("../models/shiftModel");
const User = require("../models/userModel");

exports.createShift = async (req, res) => {
  try {
    const { name, start_time, end_time, late_threshold_minutes } = req.body;
    const user_id = req.user._id || req.user; // Admin ID

    if (!name || !start_time || !end_time) {
      return res.status(400).json({ message: "Name, start time, and end time are required." });
    }

    const shift = new Shift({
      name,
      start_time,
      end_time,
      late_threshold_minutes: Number(late_threshold_minutes) || 0,
      user_id
    });

    await shift.save();
    res.status(201).json({ success: true, message: "Shift created successfully", data: shift });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Shift with this name already exists." });
    }
    console.error("Create Shift Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getShifts = async (req, res) => {
  try {
    const user_id = req.user._id || req.user;
    const shifts = await Shift.find({ user_id }).sort({ name: 1 });
    res.status(200).json({ success: true, data: shifts });
  } catch (err) {
    console.error("Get Shifts Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateShift = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { name, start_time, end_time, late_threshold_minutes } = req.body;
    const user_id = req.user._id || req.user;

    const updateFields = {
      name,
      start_time,
      end_time,
      late_threshold_minutes: Number(late_threshold_minutes) || 0
    };

    const shift = await Shift.findOneAndUpdate(
      { _id: shiftId, user_id },
      { $set: updateFields },
      { new: true }
    );

    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

    res.status(200).json({ success: true, message: "Shift updated successfully", data: shift });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Shift with this name already exists." });
    }
    console.error("Update Shift Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteShift = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const user_id = req.user._id || req.user;

    const shift = await Shift.findOneAndDelete({ _id: shiftId, user_id });
    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

    res.status(200).json({ success: true, message: "Shift deleted successfully" });
  } catch (err) {
    console.error("Delete Shift Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
