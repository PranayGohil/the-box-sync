const notificationService = require('./notification/notificationService');

module.exports = {
  sendEmail: (payload) => notificationService.sendEmail(payload),
  sendSMS: (payload) => notificationService.sendSMS(payload),
  sendWhatsApp: (payload) => notificationService.sendWhatsApp(payload)
};
