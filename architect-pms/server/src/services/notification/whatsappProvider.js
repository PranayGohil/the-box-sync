class WhatsAppProvider {
  async send({ to, templateName, params }) {
    console.log(`[WhatsAppProvider] -> To: ${to} | Template: ${templateName}`);
    // Provider stub for WhatsApp Business API
    return { success: true, channel: 'whatsapp', provider: 'WhatsApp Business API (Stub)', timestamp: new Date() };
  }
}

module.exports = WhatsAppProvider;
