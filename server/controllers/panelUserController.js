const Manager = require("../models/managerModel");
const QSR = require("../models/QSRModel");
const Captain = require("../models/captainModel");
const Attendance = require("../models/attendanceModel");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const panelModels = {
  Manager: Manager,
  QSR: QSR,
  "Captain Panel": Captain,
  "Payroll By The Box": Attendance,
};

const getModel = (planName) => {
  const model = panelModels[planName];
  if (!model) throw new Error(`No model found for ${planName}`);
  return model;
};

exports.getPanelUser = async (req, res) => {
  try {
    const { planName } = req.params;
    const userId = req.user._id;

    const Model = getModel(planName);
    const account = await Model.findOne({ restaurant_id: userId });

    res.status(200).json({ exists: !!account, data: account });
  } catch (err) {
    console.error("Error in getPanelUser:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createOrUpdatePanelUser = async (req, res) => {
  try {
    const { planName } = req.params;
    const userId = req.user._id;
    const { username, password, adminPassword } = req.body;

    // If creating new account or changing password, verify admin password
    if (password) {
      const admin = await User.findById(userId);
      if (!admin) return res.status(404).json({ message: "Admin not found" });

      const isMatch = await bcrypt.compare(adminPassword, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid admin password" });
      }
    }

    const Model = getModel(planName);
    let account = await Model.findOne({ restaurant_id: userId });

    if (account) {
      // Update
      account.username = username;
      if (password) account.password = password; // will hash in pre-save
    } else {
      // Create
      account = new Model({ restaurant_id: userId, username, password });
    }

    await account.save();
    res
      .status(200)
      .json({ message: "Panel user saved successfully", data: account });
  } catch (err) {
    console.error("Error in createOrUpdatePanelUser:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.changePanelPassword = async (req, res) => {
  try {
    const { planName } = req.params;
    const userId = req.user._id;
    const { adminPassword, newPassword } = req.body;

    // Verify admin password
    const admin = await User.findById(userId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin password" });
    }

    // Get correct panel model
    const Model = getModel(planName);
    const panelUser = await Model.findOne({ restaurant_id: userId });
    if (!panelUser) {
      return res.status(404).json({ message: "Panel account not found" });
    }

    // Update panel password (will hash via pre-save)
    panelUser.password = newPassword;
    await panelUser.save();

    res.status(200).json({ message: "Panel password updated successfully" });
  } catch (err) {
    console.error("Error in changePanelPassword:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deletePanelUser = async (req, res) => {
  try {
    const { planName } = req.params;
    const userId = req.user._id;

    const Model = getModel(planName);
    const deleted = await Model.findOneAndDelete({ restaurant_id: userId });

    if (!deleted) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({ message: "Panel user deleted successfully" });
  } catch (err) {
    console.error("Error in deletePanelUser:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
