class SMSProvider {
  async send({ to, text }) {
    console.log(`[SMSProvider] -> To: ${to} | Message: ${text}`);
    // Provider stub for Twilio / MSG91
    return { success: true, channel: 'sms', provider: 'Twilio/MSG91 (Stub)', timestamp: new Date() };
  }
}

module.exports = SMSProvider;
