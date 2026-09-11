const EmailProvider = require('./emailProvider');
const SMSProvider = require('./smsProvider');
const WhatsAppProvider = require('./whatsappProvider');

class NotificationService {
  constructor() {
    this.emailProvider = new EmailProvider();
    this.smsProvider = new SMSProvider();
    this.whatsappProvider = new WhatsAppProvider();
  }

  async sendEmail(payload) {
    return await this.emailProvider.send(payload);
  }

  async sendSMS(payload) {
    return await this.smsProvider.send(payload);
  }

  async sendWhatsApp(payload) {
    return await this.whatsappProvider.send(payload);
  }

  async notifyAllChannels({ user, message, subject }) {
    const results = [];
    if (user.email) {
      results.push(await this.sendEmail({ to: user.email, subject, htmlBody: message }));
    }
    if (user.phone) {
      results.push(await this.sendSMS({ to: user.phone, text: message }));
    }
    return results;
  }
}

const instance = new NotificationService();
module.exports = instance;
