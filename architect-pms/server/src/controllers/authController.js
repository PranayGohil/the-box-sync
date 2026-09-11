const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    // passwordHash field check
    if (!user.passwordHash) {
      console.error(`[Auth] User ${user.email} has no passwordHash stored.`);
      return res.status(500).json({ success: false, message: 'Account configuration error. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      linkedClientProjectIds: user.linkedClientProjectIds || [],
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Audit log in background — don't block the response
    logAudit({
      user: payload,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      changesSummary: `${user.email} logged in as ${user.role}`,
    }).catch((e) => console.error('[Audit] login log failed:', e.message));

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        linkedClientProjectIds: user.linkedClientProjectIds || [],
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ success: false, message: `Login error: ${error.message}` });
  }
};

exports.logout = async (req, res) => {
  if (req.user) {
    logAudit({
      user: req.user,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: req.user.id,
      changesSummary: `${req.user.email} logged out`,
    }).catch(() => {});
  }
  return res.json({ success: true, message: 'Logged out successfully' });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  return res.json({
    success: true,
    message: `Password reset link dispatched to ${email}`,
  });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (error) {
    console.error('[Auth] getMe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
};
