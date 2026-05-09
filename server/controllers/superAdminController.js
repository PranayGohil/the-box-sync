const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/superAdminModel");
const { logActivity } = require("../utils/auditLogger");

const superAdminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username (including the password field which is select: false)
    const admin = await SuperAdmin.findOne({ username }).select("+password");

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await admin.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { 
        _id: admin._id.toString(), 
        superEmail: admin.email, 
        username: admin.username,
        Role: "Super Admin",
        adminRole: admin.role
      },
      process.env.JWT_SECRETKEY,
      { expiresIn: "30d" }
    );
    
    // Log Login Activity
    await logActivity({ _id: admin._id, username: admin.username }, "LOGIN", null, { ip: req.ip });

    return res.status(200).json({ 
      message: "Login successful", 
      token,
      role: admin.role 
    });

  } catch (error) {
    console.error("Super Admin Login Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const User = require("../models/userModel");

const impersonateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate standard Admin token for this restaurant user
    const token = await user.generateAuthToken("Admin");

    // Log Impersonation Activity
    await logActivity(
      { _id: req.user._id, username: req.user.username },
      "IMPERSONATE",
      user._id,
      { restaurant_name: user.name, restaurant_code: user.restaurant_code }
    );

    console.log(`Super Admin ${req.user.superEmail} is impersonating user: ${user.email}`);

    return res.status(200).json({ 
      message: "Impersonation token generated", 
      token,
      user
    });

  } catch (error) {
    console.error("Impersonation Error:", error);
    return res.status(500).json({ message: "Server error during impersonation" });
  }
};

const AuditLog = require("../models/auditLogModel");

const getAuditLogs = async (req, res) => {
  try {
    // Only Owners can see the full timeline (though we might allow Staff to see their own history later)
    if (req.user.adminRole !== "Owner") {
      return res.status(403).json({ message: "Forbidden: Owner access required for timeline" });
    }

    const { adminId } = req.query;
    const query = adminId ? { adminId } : {};

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(200); // Fetch last 200 actions

    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Fetch Logs Error:", error);
    return res.status(500).json({ message: "Server error fetching logs" });
  }
};

const createSubAdmin = async (req, res) => {
  try {
    if (req.user.adminRole !== "Owner") {
      return res.status(403).json({ message: "Forbidden: Only Owner can create other admins" });
    }

    const { username, email, password, role } = req.body;

    const existingAdmin = await SuperAdmin.findOne({ $or: [{ username }, { email }] });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin with this username or email already exists" });
    }

    const newAdmin = new SuperAdmin({
      username,
      email,
      password,
      role: role || "Staff",
    });

    await newAdmin.save();

    await logActivity(
      { _id: req.user._id, username: req.user.username },
      "CREATE_ADMIN",
      newAdmin._id,
      { username: newAdmin.username, role: newAdmin.role }
    );

    return res.status(201).json({ message: "Admin created successfully", admin: { _id: newAdmin._id, username: newAdmin.username, role: newAdmin.role } });
  } catch (error) {
    console.error("Create Admin Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    if (req.user.adminRole !== "Owner") {
      return res.status(403).json({ message: "Forbidden: Owner access required" });
    }

    const admins = await SuperAdmin.find().select("-password");
    return res.status(200).json({ success: true, data: admins });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteSubAdmin = async (req, res) => {
  try {
    if (req.user.adminRole !== "Owner") {
      return res.status(403).json({ message: "Forbidden: Only Owner can delete admins" });
    }

    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user._id) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    const admin = await SuperAdmin.findByIdAndDelete(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    await logActivity(
      { _id: req.user._id, username: req.user.username },
      "DELETE_ADMIN",
      id,
      { username: admin.username }
    );

    return res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { 
  superAdminLogin, 
  impersonateUser, 
  getAuditLogs, 
  createSubAdmin, 
  getAllAdmins, 
  deleteSubAdmin 
};
