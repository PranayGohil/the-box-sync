const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/superAdminModel");
const { logActivity } = require("../utils/auditLogger");
const { sendEmail } = require("../utils/emailService");

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

const toggleApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    user.isApproved = !user.isApproved;
    await user.save();

    await logActivity(
      { _id: req.user._id, username: req.user.username },
      user.isApproved ? "APPROVE_RESTAURANT" : "REVOKE_RESTAURANT",
      id,
      { restaurant_name: user.name }
    );

    if (user.isApproved) {
      try {
        const approvalEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background: #7444FD; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
              <h2 style="color: #fff; margin: 0;">Account Activated!</h2>
            </div>
            <div style="padding: 24px; background: #fafafa;">
              <p style="color: #333; font-size: 16px;">Dear <strong>${user.name}</strong>,</p>
              <p style="color: #555;">We are pleased to inform you that your restaurant account at <strong>TheBox</strong> has been approved and activated by the Super Admin.</p>
              <p style="color: #555;">You can now log in to your admin panel and start setting up your restaurant management features.</p>
              
              <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; color: #4a5568;"><strong>Restaurant Details:</strong></p>
                <p style="margin: 0 0 6px 0; color: #555;"><strong>Restaurant Code:</strong> ${user.restaurant_code}</p>
                <p style="margin: 0; color: #555;"><strong>Registered Email:</strong> ${user.email}</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://theboxsync.com/login" style="background: #7444FD; color: #fff; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px; text-decoration: none; display: inline-block;">Log In to Dashboard</a>
              </div>

              <p style="color: #555;">If you have any questions or require assistance setting up your menus or staff, feel free to reach out to our customer support team at <a href="mailto:support@theboxsync.com" style="color: #7444FD; text-decoration: none;">support@theboxsync.com</a>.</p>
              <p style="color: #555; margin-top: 24px;">Best regards,<br><strong>The TheBox Team</strong></p>
            </div>
            <div style="padding: 12px 24px; background: #f0f0f0; border-radius: 0 0 6px 6px; text-align: center; font-size: 12px; color: #999;">
              © TheBox | <a href="https://theboxsync.com" style="color: #7444FD; text-decoration: none;">theboxsync.com</a>
            </div>
          </div>
        `;

        await sendEmail({
          to: user.email,
          subject: "Your TheBox Account Has Been Approved and Activated!",
          html: approvalEmailHtml,
        });
        console.log(`Approval email successfully sent to ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }
    }

    return res.status(200).json({ message: "Approval status updated", isApproved: user.isApproved });
  } catch (error) {
    console.error("Toggle Approval Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { 
  superAdminLogin, 
  impersonateUser, 
  getAuditLogs, 
  createSubAdmin, 
  getAllAdmins, 
  deleteSubAdmin,
  toggleApproval
};
