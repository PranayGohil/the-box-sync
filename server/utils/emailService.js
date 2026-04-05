// emailService.js
const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SUPPORT_USER,
  EMAIL_FROM,
  EMAIL_SUPPORT_FROM,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 465,
  secure: Number(SMTP_PORT) === 465, // true for 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  // Optional pooling if you send bursts:
  // pool: true,
  // maxConnections: 5,
  // maxMessages: 100,
});

const transporterSupport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 465,
  secure: Number(SMTP_PORT) === 465, // true for 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: SMTP_SUPPORT_USER,
    pass: SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html, text, replyTo }) {
  const mailOptions = {
    from: EMAIL_FROM || SMTP_USER, // must be your Hostinger mailbox/domain
    to,
    subject,
    text: text || undefined,       // include text for better deliverability
    html,
    replyTo
  };
  
  return transporter.sendMail(mailOptions);
}

async function sendSupportEmail({ to, subject, html, text, replyTo }) {
  const mailOptions = {
    from: EMAIL_SUPPORT_FROM || SMTP_SUPPORT_USER, // must be your Hostinger mailbox/domain
    to,
    subject,
    text: text || undefined,       // include text for better deliverability
    html,
    replyTo
  };

  return transporterSupport.sendMail(mailOptions);
}
// Optional: quick health check you can call at startup
async function verifyTransporter() {
  return transporter.verify();
}

module.exports = { sendEmail, sendSupportEmail, verifyTransporter };
