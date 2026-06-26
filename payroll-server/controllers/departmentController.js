const Department = require("../models/departmentModel");
const Staff = require("../models/staffModel");

// Create a new department
exports.createDepartment = async (req, res) => {
  try {
    const { name, branch_id, is_global } = req.body;
    const user_id = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const newDept = new Department({
      name,
      user_id,
      branch_id: branch_id || null,
      is_global: is_global || false
    });

    await newDept.save();

    res.status(201).json({ message: "Department created successfully", department: newDept });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all departments for the logged-in user
exports.getDepartments = async (req, res) => {
  try {
    const user_id = req.user._id;

    // Fetch all departments
    const departments = await Department.find({ user_id }).sort({ createdAt: 1 });

    res.status(200).json({ departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user._id;

    const department = await Department.findOneAndDelete({ _id: id, user_id });
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Move all staff back to unassigned
    await Staff.updateMany({ department: id }, { $unset: { department: 1 } });

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Assign staff to a department (or unassign)
exports.assignStaff = async (req, res) => {
  try {
    const { staff_id, department_id, department_node_id } = req.body;
    const user_id = req.user._id;

    if (!staff_id) {
      return res.status(400).json({ message: "Staff ID is required" });
    }

    const staff = await Staff.findOne({ _id: staff_id, user_id });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (department_id) {
      // Verify department exists
      const dept = await Department.findOne({ _id: department_id, user_id });
      if (!dept) {
        return res.status(404).json({ message: "Department not found" });
      }
      staff.department = department_id;
      staff.department_node_id = department_node_id || null;
      // Auto-sync branch_id if department has one
      if (dept.branch_id) {
        staff.branch_id = dept.branch_id;
      } else if (dept.is_global) {
        staff.branch_id = null;
      }
    } else {
      // Unassign department
      staff.department = null;
      staff.department_node_id = null;
      staff.branch_id = null;
    }

    await staff.save();

    res.status(200).json({ message: "Staff assigned successfully", staff });
  } catch (error) {
    console.error("Error assigning staff:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update department hierarchy structure
exports.updateStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const { structure } = req.body;
    const user_id = req.user._id;

    const dept = await Department.findOneAndUpdate(
      { _id: id, user_id },
      { structure },
      { new: true }
    );

    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({ message: "Structure updated successfully", department: dept });
  } catch (error) {
    console.error("Error updating structure:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
