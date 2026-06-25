const Branch = require("../models/branchModel");
const Staff = require("../models/staffModel");

// Create a new branch
exports.createBranch = async (req, res) => {
  try {
    const { name, address } = req.body;
    const user_id = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Branch name is required" });
    }

    const newBranch = new Branch({
      name,
      address,
      user_id,
    });

    await newBranch.save();

    res.status(201).json({ message: "Branch created successfully", branch: newBranch });
  } catch (error) {
    console.error("Error creating branch:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all branches for the logged-in user
exports.getBranches = async (req, res) => {
  try {
    const user_id = req.user._id;

    const branches = await Branch.find({ user_id }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a branch
exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user._id;

    const branch = await Branch.findOneAndDelete({ _id: id, user_id });
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Unassign staff from this branch
    await Staff.updateMany({ branch_id: id }, { $unset: { branch_id: 1, department: 1, department_node_id: 1 } });

    // Delete all departments under this branch
    const Department = require("../models/departmentModel");
    await Department.deleteMany({ branch_id: id });

    res.status(200).json({ message: "Branch and its departments deleted successfully" });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Assign staff to a branch (or unassign)
exports.assignStaff = async (req, res) => {
  try {
    const { staff_id, branch_id } = req.body;
    const user_id = req.user._id;

    if (!staff_id) {
      return res.status(400).json({ message: "Staff ID is required" });
    }

    const staff = await Staff.findOne({ _id: staff_id, user_id });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (branch_id) {
      const branch = await Branch.findOne({ _id: branch_id, user_id });
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      staff.branch_id = branch_id;
    } else {
      staff.branch_id = undefined;
    }

    await staff.save();

    res.status(200).json({ message: "Staff assigned successfully", staff });
  } catch (error) {
    console.error("Error assigning staff to branch:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

