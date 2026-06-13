const User = require("../models/userModel");
const Staff = require("../models/staffModel");
const PayrollConfig = require("../models/PayrollConfig");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ── POST /api/kiosk/login ─────────────────────────────────────────────────────
// Attendance kiosk login — uses the SAME email + password as the Payroll login.
// No separate credentials needed. Both systems share the same user account.
exports.kioskLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find by email (case-insensitive) — first check user (admin)
    const emailRegex = new RegExp("^" + email.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i");
    const user = await User.findOne({ email: emailRegex }).select("+password");
    let token;
    let userData;

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      // Issue token — same format as payroll
      token = await user.generateAuthToken("Admin");
      userData = {
        _id: user._id,
        name: user.name,
        logo: user.logo,
        email: user.email,
        role: "admin",
      };
    } else {
      // Check Staff collection (case-insensitive)
      const staff = await Staff.findOne({ email: emailRegex }).select("+password");
      if (!staff) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const isMatch = await staff.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      token = jwt.sign(
        { _id: staff.user_id, staff_id: staff._id.toString(), Role: "Staff" },
        process.env.JWT_SECRETKEY,
        { expiresIn: "30d" }
      );
      userData = {
        _id: staff._id,
        name: `${staff.f_name} ${staff.l_name}`,
        email: staff.email,
        role: "staff",
      };
    }

    return res.status(200).json({
      message: "Logged In",
      token,
      user: userData,
    });
  } catch (err) {
    console.error("Kiosk login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ── GET /api/kiosk/me ─────────────────────────────────────────────────────────
// Returns company info for the kiosk header and network restriction status
exports.kioskMe = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const user = await User.findById(userId)
      .select("name logo restaurant_code email")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found." });

    // Determine client IP
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp) {
      // Clean up IPv6 mapped IPv4 addresses and handle multiple forwarded IPs
      clientIp = clientIp.split(',')[0].trim();
      if (clientIp.includes('::ffff:')) {
        clientIp = clientIp.split('::ffff:')[1];
      }
      if (clientIp === '::1') {
        clientIp = '127.0.0.1';
      }
    }

    // Check Network Restrictions
    let is_restricted = false;
    const config = await PayrollConfig.findOne({ user_id: userId }).lean();
    if (config && config.network_restrictions && config.network_restrictions.is_enabled) {
      const allowedIps = config.network_restrictions.allowed_ips || [];
      if (!allowedIps.includes(clientIp)) {
        is_restricted = true;
      }
    }

    return res.json({
      ...user,
      client_ip: clientIp,
      is_restricted
    });
  } catch (err) {
    console.error("Kiosk me error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
