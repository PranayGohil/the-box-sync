const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Otp = require("../models/otpModel");
const SuperAdmin = require("../models/superAdminModel");
const { logActivity } = require("../utils/auditLogger");
const { sendEmail } = require("../utils/emailService");

const AUTHORIZED_EMAILS = ["vishal@tripolystudio.com", "admin@theboxsync.com", "rushimaru96@gmail.com"];

const generateOtp = (length = 6) => {
    let otp = '';
    while (otp.length < length) {
        const byte = crypto.randomBytes(1)[0] % 10;
        otp += byte.toString();
    }
    return otp.slice(0, length);
};

const superAdminRequestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    
    if (!AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
      return res.status(401).json({ message: "Email is not authorised" });
    }

    // Ensure SuperAdmin record exists for the authorized email to allow JWT signing later
    let admin = await SuperAdmin.findOne({ email });
    if (!admin) {
      const dummyPassword = crypto.randomBytes(16).toString('hex');
      admin = new SuperAdmin({ 
        username: email.split("@")[0], 
        email, 
        password: dummyPassword,
        role: "Owner" 
      });
      await admin.save();
    }

    const otpPlain = generateOtp(6);
    const codeHash = await bcrypt.hash(otpPlain, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    const otpDoc = new Otp({
      email,
      codeHash,
      purpose: 'superadmin_login',
      createdAt: new Date(),
      expiresAt,
      verified: false,
    });
    await otpDoc.save();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: #7444FD; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0;">Super Admin Login OTP</h2>
        </div>
        <div style="padding: 24px; background: #fafafa;">
          <p style="color: #333; font-size: 16px;">Hello,</p>
          <p style="color: #555;">Use the following One Time Password (OTP) to securely log in to the Super Admin Command Center:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="background: #7444FD; color: #fff; padding: 12px 24px; font-size: 28px; font-weight: bold; border-radius: 6px; letter-spacing: 4px;">${otpPlain}</span>
          </div>
          <p style="color: #555; text-align: center;">This code will expire in <strong>5 minutes</strong>.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: "Your Super Admin OTP Code",
        html: emailHtml,
      });
    } catch (err) {
      console.log(`\n=== DEV OTP FOR ${email}: ${otpPlain} ===\n`);
    }

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP Request Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const superAdminVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    if (!AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
      return res.status(401).json({ message: "Email is not authorised" });
    }

    const otpDoc = await Otp.findOne({
      email,
      purpose: 'superadmin_login',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(String(otp), otpDoc.codeHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    // Generate Token
    const admin = await SuperAdmin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin record missing" });
    }

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
    
    await logActivity({ _id: admin._id, username: admin.username }, "LOGIN", null, { ip: req.ip });

    return res.status(200).json({ 
      message: "Login successful", 
      token,
      role: admin.role,
      user: admin
    });

  } catch (error) {
    console.error("OTP Verify Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

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
const ShopUser = require("../models/shopUserModel");

const impersonateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    let user = await User.findById(userId);
    let isShopUser = false;

    if (!user) {
      user = await ShopUser.findById(userId);
      isShopUser = true;
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate standard Admin token for this restaurant/shop user
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
    const { price, discount, paymentMode, paymentDetails, isApproved, revokeReason, startDate, endDate } = req.body;

    let user = await User.findById(id);
    let isShopUser = false;

    if (!user) {
      user = await ShopUser.findById(id);
      isShopUser = true;
    }

    if (!user) {
      return res.status(404).json({ message: "Restaurant/Shop not found" });
    }

    const newApprovalStatus = typeof isApproved === 'boolean' ? isApproved : !user.isApproved;
    const updateData = { isApproved: newApprovalStatus };

    if (newApprovalStatus) {
      updateData.approvalDetails = {
        price: Number(price) || 0,
        discount: Number(discount) || 0,
        paymentMode: paymentMode || "Not Provided",
        paymentDetails: paymentDetails || "",
        approvedAt: new Date(),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) })
      };
    } else {
      updateData.$unset = { approvalDetails: 1 };
    }

    if (isShopUser) {
      await ShopUser.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      await User.findByIdAndUpdate(id, updateData, { new: true });
    }
    user.isApproved = newApprovalStatus; // for subsequent logic

    await logActivity(
      { _id: req.user._id, username: req.user.username },
      user.isApproved ? "APPROVE_RESTAURANT" : "REVOKE_RESTAURANT",
      id,
      { restaurant_name: user.name }
    );

    if (user.isApproved) {
      try {
        let planName = "No Active Plan";
        let startDateStr = "N/A";
        let expiryDateStr = "N/A";
        
        if (isShopUser) {
           planName = "Manage Shop";
           if (startDate) startDateStr = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
           if (endDate) expiryDateStr = new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } else if (user.is_street_food) {
           planName = "Manage Street Food";
           if (startDate) startDateStr = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
           if (endDate) expiryDateStr = new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } else {
          try {
            const Subscription = require("../models/subscriptionModel");
            const activeSub = await Subscription.findOne({ user_id: id, status: "active" }).sort({ end_date: -1 });
            if (activeSub) {
              planName = activeSub.plan_name || planName;
              if (activeSub.start_date) startDateStr = new Date(activeSub.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
              if (activeSub.end_date) expiryDateStr = new Date(activeSub.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            }
          } catch (subErr) {
            console.error("Error fetching subscription for email template", subErr);
          }
        }

        const approvalEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background: #7444FD; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
              <h2 style="color: #fff; margin: 0;">Account Activated!</h2>
            </div>
            <div style="padding: 24px; background: #fafafa;">
              <p style="color: #333; font-size: 16px;">Dear <strong>${user.name}</strong>,</p>
              <p style="color: #555;">We are pleased to inform you that your restaurant account at <strong>TheBox</strong> has been approved and activated by the Super Admin.</p>
              <p style="color: #2e7d32; font-size: 16px; font-weight: bold; margin: 15px 0;">Your account is approved and ready to use.</p>
              
              <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 12px 0; color: #4a5568; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;"><strong>Account & Plan Details:</strong></p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 4px 0; color: #555;"><strong>Restaurant Code:</strong></td> <td style="padding: 4px 0; color: #333; text-align: right;">${user.restaurant_code}</td></tr>
                  <tr><td style="padding: 4px 0; color: #555;"><strong>Active Plan:</strong></td> <td style="padding: 4px 0; color: #333; text-align: right;">${planName}</td></tr>
                  <tr><td style="padding: 4px 0; color: #555;"><strong>Active On Date:</strong></td> <td style="padding: 4px 0; color: #333; text-align: right;">${startDateStr}</td></tr>
                  <tr><td style="padding: 4px 0; color: #555;"><strong>Expiry Date:</strong></td> <td style="padding: 4px 0; color: #333; text-align: right;">${expiryDateStr}</td></tr>
                </table>
              </div>

              <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 12px 0; color: #4a5568; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;"><strong>Payment Details:</strong></p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 4px 0; color: #555;"><strong>Amount Paid:</strong></td> <td style="padding: 4px 0; color: #333; text-align: right;">₹${price || 0}</td></tr>
                  <tr><td style="padding: 4px 0; color: #555;"><strong>Payment Mode:</strong></td> <td style="padding: 4px 0; color: #333; text-align: right;">${paymentMode || 'N/A'}</td></tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://admin.theboxsync.com/login" style="background: #7444FD; color: #fff; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px; text-decoration: none; display: inline-block;">Log In to Dashboard</a>
              </div>
              <p style="color: #555;">If you have any questions, reach out to <a href="mailto:support@theboxsync.com" style="color: #7444FD;">support@theboxsync.com</a>.</p>
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
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }
    } else {
      try {
        const revokeReasonText = revokeReason || "Administrative decision or violation of terms.";
        const revokeEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background: #e53e3e; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
              <h2 style="color: #fff; margin: 0;">Account Access Revoked</h2>
            </div>
            <div style="padding: 24px; background: #fafafa;">
              <p style="color: #333; font-size: 16px;">Dear <strong>${user.name}</strong>,</p>
              <p style="color: #555;">This email is to inform you that your restaurant account at <strong>TheBox</strong> has been revoked by the Super Admin.</p>
              
              <div style="background: #ffffff; border: 1px solid #fed7d7; border-left: 4px solid #e53e3e; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; color: #c53030;"><strong>Reason for Revocation:</strong></p>
                <p style="margin: 0; color: #333; font-style: italic;">"${revokeReasonText}"</p>
              </div>

              <p style="color: #555;">You will no longer be able to log in or access your dashboard. If you believe this is an error or wish to appeal this decision, please contact our support team immediately.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://theboxsync.com/contact.html" style="background: #4a5568; color: #fff; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px; text-decoration: none; display: inline-block;">Contact Support</a>
              </div>
              <p style="color: #555; margin-top: 24px;">Best regards,<br><strong>The TheBox Team</strong></p>
            </div>
            <div style="padding: 12px 24px; background: #f0f0f0; border-radius: 0 0 6px 6px; text-align: center; font-size: 12px; color: #999;">
              © TheBox | <a href="https://theboxsync.com" style="color: #4a5568; text-decoration: none;">theboxsync.com</a>
            </div>
          </div>
        `;

        await sendEmail({
          to: user.email,
          subject: "Notice: Your TheBox Account Has Been Revoked",
          html: revokeEmailHtml,
        });
      } catch (emailError) {
        console.error("Failed to send revoke email:", emailError);
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
  superAdminRequestOtp,
  superAdminVerifyOtp,
  impersonateUser, 
  getAuditLogs, 
  createSubAdmin, 
  getAllAdmins, 
  deleteSubAdmin,
  toggleApproval
};
