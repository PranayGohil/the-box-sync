const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../middleware/audit');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').populate('linkedClientProjectIds', 'caseNo projectName');
    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, linkedClientProjectIds, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'Password@123', salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'staff',
      linkedClientProjectIds: linkedClientProjectIds || [],
      phone: phone || '',
    });

    await logAudit({
      user: req.user,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user._id,
      changesSummary: `Created user ${user.email} with role '${user.role}'`,
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;
    return res.status(201).json({ success: true, data: userObj });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, role, status, linkedClientProjectIds, phone, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (status) user.status = status;
    if (phone !== undefined) user.phone = phone;
    if (linkedClientProjectIds) user.linkedClientProjectIds = linkedClientProjectIds;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();

    await logAudit({
      user: req.user,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: user._id,
      changesSummary: `Updated profile & role for ${user.email}`,
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;
    return res.json({ success: true, data: userObj });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
