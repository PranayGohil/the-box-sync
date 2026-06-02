const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

// ── POST /api/kiosk/login ─────────────────────────────────────────────────────
// Attendance kiosk login — uses the SAME email + password as the Payroll login.
// No separate credentials needed. Both systems share the same user account.
exports.kioskLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find by email — same as payroll login
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Issue token — same format as payroll
    const token = await user.generateAuthToken("Admin");

    return res.status(200).json({
      message: "Logged In",
      token,
      user: {
        _id: user._id,
        name: user.name,
        logo: user.logo,
        email: user.email,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("Kiosk login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ── GET /api/kiosk/me ─────────────────────────────────────────────────────────
// Returns company info for the kiosk header
exports.kioskMe = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const user = await User.findById(userId)
      .select("name logo restaurant_code email")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json(user);
  } catch (err) {
    console.error("Kiosk me error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
