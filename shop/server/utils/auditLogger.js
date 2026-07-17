const AuditLog = require("../models/auditLogModel");

/**
 * Utility to record Super Admin actions
 * @param {Object} admin - The admin object from req.user
 * @param {String} action - The action type (e.g., "IMPERSONATE")
 * @param {String} targetId - The ID of the affected resource (User, Plan, etc)
 * @param {Object} details - Additional metadata about the action
 */
const logActivity = async (admin, action, targetId = null, details = {}) => {
  try {
    if (!admin || !admin._id) {
      console.warn("Attempted to log activity without admin context");
      return;
    }

    const log = new AuditLog({
      adminId: admin._id,
      adminName: admin.username || admin.superEmail || "Unknown Admin",
      action,
      targetId,
      details,
    });

    await log.save();
  } catch (error) {
    console.error("Critical Error: Failed to save audit log:", error);
  }
};

module.exports = { logActivity };
