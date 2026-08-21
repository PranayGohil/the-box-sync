const { AuditLog, Notification } = require('../models');

class AuditService {
  /**
   * Log an audited user action
   */
  static async logAction({
    businessId,
    userId,
    userName = 'System',
    action,
    module,
    recordId = null,
    recordNo = '',
    previousState = null,
    newState = null,
    ipAddress = ''
  }) {
    try {
      await AuditLog.create({
        businessId,
        userId,
        userName,
        action,
        module,
        recordId,
        recordNo,
        previousState,
        newState,
        ipAddress,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('[AuditService Error]: Failed to create audit log', err.message);
    }
  }

  /**
   * Create an In-App Notification
   */
  static async createNotification({
    businessId,
    userId = null,
    type = 'general',
    title,
    message,
    linkUrl = ''
  }) {
    try {
      await Notification.create({
        businessId,
        userId,
        type,
        title,
        message,
        linkUrl,
        isRead: false
      });
    } catch (err) {
      console.error('[Notification Error]: Failed to send notification', err.message);
    }
  }
}

module.exports = AuditService;
