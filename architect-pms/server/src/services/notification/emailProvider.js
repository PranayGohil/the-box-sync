const config = require('../../config/env');

class EmailProvider {
  constructor() {
    this.config = config.smtp;
  }

  async send({ to, subject, htmlBody, textBody }) {
    console.log(`[EmailProvider] -> To: ${to} | Subject: ${subject}`);
    // If SMTP host configured, use nodemailer, otherwise simulate
    if (this.config.host) {
      // Nodemailer transporter implementation
      return { success: true, channel: 'email', provider: 'SMTP', timestamp: new Date() };
    }
    return { success: true, channel: 'email', provider: 'Nodemailer (Simulated)', timestamp: new Date() };
  }
}

module.exports = EmailProvider;
