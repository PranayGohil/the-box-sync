const Waiter = require("../models/waiterModel");
const Staff = require("../models/staffModel");

const addWaiter = async (req, res) => {
  try {
    const user_id = req.user;
    const { full_name } = req.body;
    console.log(user_id, full_name);
    const newWaiter = new Waiter({ user_id, full_name });
    await newWaiter.save();
    res.status(201).json({ message: "Waiter added successfully" });
  } catch (error) {
    console.error("Error adding waiter:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getWaiters = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch from both models in parallel
    const [waitersFromWaiterModel, waitersFromStaffModel] = await Promise.all([
      Waiter.find({ user_id: userId }).lean(),
      Staff.find({
        user_id: userId,
        position: { $in: ["Waiter", "Waitress", "Server"] },
      }).lean(),
    ]);

    // Transform staff data to match waiter format
    const transformedStaffWaiters = waitersFromStaffModel.map((staff) => ({
      _id: staff._id,
      user_id: staff.user_id,
      full_name: `${staff.f_name} ${staff.l_name}`.trim(),
      staff_id: staff.staff_id,
      email: staff.email,
      phone_no: staff.phone_no,
      position: staff.position,
      photo: staff.photo,
      source: "staff",
    }));

    // Transform original waiter data to include source
    const transformedWaiters = waitersFromWaiterModel.map((waiter) => ({
      ...waiter,
      source: "waiter",
    }));

    // Combine both arrays
    const allWaiters = [...transformedWaiters, ...transformedStaffWaiters];

    // Remove duplicates based on full_name (case-insensitive)
    // Priority: Staff model takes precedence over Waiter model
    const uniqueWaiters = [];
    const seenNames = new Set();

    // Process staff waiters first (higher priority)
    for (const waiter of transformedStaffWaiters) {
      const normalizedName = waiter.full_name.toLowerCase().trim();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueWaiters.push(waiter);
      }
    }

    // Then process legacy waiters
    for (const waiter of transformedWaiters) {
      const normalizedName = waiter.full_name.toLowerCase().trim();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueWaiters.push(waiter);
      }
    }

    res.json({
      success: true,
      data: uniqueWaiters,
      count: {
        total: uniqueWaiters.length,
        fromWaiterModel: transformedWaiters.length,
        fromStaffModel: transformedStaffWaiters.length,
        duplicatesRemoved: allWaiters.length - uniqueWaiters.length,
      },
    });
  } catch (error) {
    console.error("Error fetching waiters:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const editWaiter = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name } = req.body;
    const waiter = await Waiter.findById(id);
    if (!waiter) {
      return res.status(404).json({ error: "Waiter not found" });
    }
    waiter.full_name = full_name;
    await waiter.save();
    res.status(200).json({ message: "Waiter updated successfully" });
  } catch (error) {
    console.error("Error updating waiter:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteWaiter = async (req, res) => {
  try {
    const { id } = req.params;
    const waiter = await Waiter.findByIdAndDelete(id);

    res.status(200).json({ message: "Waiter deleted successfully" });
  } catch (error) {
    console.error("Error deleting waiter:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addWaiter,
  getWaiters,
  editWaiter,
  deleteWaiter,
};
