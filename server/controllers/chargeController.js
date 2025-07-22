const User = require("../models/userModel");

const updateCharges = async (req, res) => {
  const { userId, charges } = req.body;
  try {
    await User.findByIdAndUpdate(userId, { charges }, { new: true });
    res.status(200).send("User charges updated successfully!");
  } catch (error) {
    console.error("Error updating user charges:", error);
    res.status(500).send("Failed to update charges.");
  }
};

const addContainerCharge = async (req, res) => {
  const userId = req.user;
  const { name, size, price } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.containerCharges.push({ name, size, price });
    await user.save();
    res.json({ message: "Container charge added successfully!", user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const getContainerCharges = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.containerCharges);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const updateContainerCharge = async (req, res) => {
  const userId = req.user;
  const { name, size, price } = req.body.updatedCharge;
  const chargeIndex = req.body.index;
  console.log(chargeIndex);

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.containerCharges[chargeIndex] = { name, size, price };
    await user.save();
    res.json({ message: "Container charge updated successfully!", user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const deleteContainerCharge = async (req, res) => {
  const userId = req.user;
  const chargeIndex = req.body.index;

  console.log("Charge Index : ", req.body);

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.containerCharges.splice(chargeIndex, 1);
    await user.save();
    res.json({ message: "Container charge deleted successfully!", user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  updateCharges,
  addContainerCharge,
  getContainerCharges,
  updateContainerCharge,
  deleteContainerCharge,
};
