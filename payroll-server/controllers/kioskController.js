const User = require("../models/userModel");
const Staff = require("../models/staffModel");
const PayrollConfig = require("../models/PayrollConfig");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/emailService");

// ── Utility: generate a secure 6-digit OTP ───────────────────────────────────
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

// ── POST /api/kiosk/send-otp ─────────────────────────────────────────────────
// Step 1 — Employee enters their email; server sends a 6-digit OTP to that email.
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const emailRegex = new RegExp(
      "^" + email.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$",
      "i"
    );

    const staff = await Staff.findOne({
      $or: [{ email: emailRegex }, { staff_id: emailRegex }],
    }).select("+otp +otp_expires");

    if (!staff) {
      return res.status(404).json({
        message: "Email ID not found.",
      });
    }

    if (!staff.email) {
      return res.status(400).json({
        message: "No email address is associated with this account. Please contact your administrator.",
      });
    }

    const otp = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    staff.otp = otp;
    staff.otp_expires = expires;
    await staff.save();

    // Send OTP email
    await sendEmail({
      to: staff.email,
      subject: "Your Employee Panel Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1e293b; margin-bottom: 4px;">Employee Panel Login</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 0;">Use the OTP below to sign in to your Employee Self-Service portal.</p>
          <div style="background: #0f172a; color: #23b3f4; letter-spacing: 10px; font-size: 36px; font-weight: bold; text-align: center; padding: 24px 16px; border-radius: 10px; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 13px; text-align: center;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            If you did not request this, please ignore this email or contact your administrator at <a href="mailto:support@theboxsync.com" style="color: #23b3f4;">support@theboxsync.com</a>
          </p>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 8px;">
            © TheBoxSync · <a href="https://theboxsync.com" style="color: #23b3f4;">theboxsync.com</a>
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "OTP sent successfully! Check your inbox.",
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ── POST /api/kiosk/verify-otp ───────────────────────────────────────────────
// Step 2 — Employee submits the 6-digit OTP; server verifies and issues a JWT.
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const emailRegex = new RegExp(
      "^" + email.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$",
      "i"
    );

    const staff = await Staff.findOne({
      $or: [{ email: emailRegex }, { staff_id: emailRegex }],
    }).select("+otp +otp_expires");

    if (!staff) {
      return res.status(401).json({ message: "Invalid OTP or email." });
    }

    if (!staff.otp || !staff.otp_expires) {
      return res.status(401).json({ message: "No OTP was requested. Please request a new one." });
    }

    if (new Date() > staff.otp_expires) {
      // Clear expired OTP
      staff.otp = undefined;
      staff.otp_expires = undefined;
      await staff.save();
      return res.status(401).json({ message: "OTP has expired. Please request a new one." });
    }

    if (staff.otp !== String(otp).trim()) {
      return res.status(401).json({ message: "Invalid OTP. Please try again." });
    }

    // OTP verified — clear it to prevent reuse
    staff.otp = undefined;
    staff.otp_expires = undefined;
    await staff.save();

    const token = jwt.sign(
      { _id: staff.user_id, staff_id: staff._id.toString(), Role: "Staff" },
      process.env.JWT_SECRETKEY,
      { expiresIn: "30d" }
    );

    const userData = {
      _id: staff._id,
      name: `${staff.f_name} ${staff.l_name}`,
      email: staff.email,
      role: "staff",
    };

    return res.status(200).json({
      message: "Logged In",
      token,
      user: userData,
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ── POST /api/kiosk/login (LEGACY — kept for backward compatibility) ──────────
// Now redirects to OTP flow internally; kept so old clients don't break.
exports.kioskLogin = async (req, res) => {
  return res.status(400).json({
    message: "Password login is no longer supported. Please use email OTP login.",
  });
};

// ── GET /api/kiosk/me ─────────────────────────────────────────────────────────
exports.kioskMe = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const user = await User.findById(userId)
      .select("name logo restaurant_code email")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found." });

    // Determine client IP
    let clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (clientIp) {
      clientIp = clientIp.split(",")[0].trim();
      if (clientIp.includes("::ffff:")) {
        clientIp = clientIp.split("::ffff:")[1];
      }
      if (clientIp === "::1") {
        clientIp = "127.0.0.1";
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
      is_restricted,
      wfh_config: config?.wfh_config || { min_interval: 3, max_interval: 15, idle_threshold: 5 },
    });
  } catch (err) {
    console.error("Kiosk me error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
