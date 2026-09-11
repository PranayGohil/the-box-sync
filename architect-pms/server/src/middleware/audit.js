const AuditLog = require('../models/AuditLog');

const logAudit = async ({ user, action, entityType, entityId, changesSummary }) => {
  try {
    await AuditLog.create({
      userId: user ? user.id || user._id : null,
      userName: user ? user.name || user.email : 'System',
      action,
      entityType,
      entityId: entityId ? String(entityId) : '',
      changesSummary: changesSummary || '',
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
};

module.exports = { logAudit };
