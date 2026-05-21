// controllers/otpController.js
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const Otp = require("../models/otpModel");
const { sendEmail } = require("../utils/emailService");
// const User = require('../models/User'); // <- uncomment & adapt if you'll mark User.emailVerified

// Config — set via env
const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10; // OTP expires after N minutes
const RESEND_COOLDOWN_SECONDS = 60; // wait between sends
const MAX_RESENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const BCRYPT_SALT_ROUNDS = 10;

// Create a transporter. Use env vars to configure SMTP.
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // e.g. smtp.gmail.com or your provider
    port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Generate a numeric OTP string of length N
function generateOtp(length = OTP_LENGTH) {
    // generate secure random digits
    let otp = '';
    while (otp.length < length) {
        const byte = crypto.randomBytes(1)[0] % 10; // 0-9
        otp += byte.toString();
    }
    // ensure no leading zeros problem? it's okay to have zeros
    return otp.slice(0, length);
}

// send OTP (or resend). Expects body { email, purpose } 
exports.sendVerification = async (req, res) => {
    try {
        const { email, purpose = 'email_verification' } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const now = new Date();

        // Rate limiting: check recent OTP for cooldown
        const lastOtp = await Otp.findOne({ email, purpose }).sort({ createdAt: -1 }).exec();

        if (lastOtp) {
            const secondsSinceLast = Math.floor((now - lastOtp.createdAt) / 1000);
            if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${RESEND_COOLDOWN_SECONDS - secondsSinceLast}s before requesting a new code`,
                });
            }
            // Check hourly resend limit
            if (lastOtp.resendCount >= MAX_RESENDS_PER_HOUR) {
                return res.status(429).json({
                    success: false,
                    message: `Too many resend requests. Try again later.`,
                });
            }
        }

        // generate OTP & hash it
        const otpPlain = generateOtp(OTP_LENGTH);
        const codeHash = await bcrypt.hash(otpPlain, BCRYPT_SALT_ROUNDS);

        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

        const otpDoc = new Otp({
            email,
            codeHash,
            purpose,
            createdAt: now,
            expiresAt,
            verified: false,
            resendCount: lastOtp ? lastOtp.resendCount + 1 : 0,
        });

        await otpDoc.save();

        // send email via nodemailer
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background: #7444FD; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
              <h2 style="color: #fff; margin: 0;">Verify Your Email</h2>
            </div>
            <div style="padding: 24px; background: #fafafa;">
              <p style="color: #333; font-size: 16px;">Hi there,</p>
              <p style="color: #555;">Please use the following One Time Password (OTP) to complete your registration process:</p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="background: #7444FD; color: #fff; padding: 12px 24px; font-size: 28px; font-weight: bold; border-radius: 6px; letter-spacing: 4px;">${otpPlain}</span>
              </div>
              <p style="color: #555; text-align: center;">This code will expire in <strong>${OTP_TTL_MINUTES} minutes</strong>.</p>
              <p style="color: #555; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
              <p style="color: #555; margin-top: 24px;">Best regards,<br><strong>The TheBox Team</strong></p>
            </div>
            <div style="padding: 12px 24px; background: #f0f0f0; border-radius: 0 0 6px 6px; text-align: center; font-size: 12px; color: #999;">
              © TheBox | <a href="mailto:support@theboxsync.com" style="color: #7444FD; text-decoration: none;">support@theboxsync.com</a>
            </div>
          </div>
        `;

        await sendEmail({
            to: email,
            subject: "OTP Verification from TheBox",
            html: emailHtml,
        });

        return res.status(200).json({ success: true, message: 'Verification code sent' });
    } catch (err) {
        console.error('sendVerification error', err);
        return res.status(500).json({ success: false, message: 'Failed to send verification code' });
    }
};

// verify OTP. Expects { email, code, purpose }
exports.verifyCode = async (req, res) => {
    try {
        const { email, code, purpose = 'email_verification' } = req.body;
        if (!email || !code) return res.status(400).json({ success: false, message: 'Email and code required' });

        // find latest non-expired OTP document for this email/purpose
        const now = new Date();
        const otpDoc = await Otp.findOne({
            email,
            purpose,
            expiresAt: { $gt: now },
        }).sort({ createdAt: -1 }).exec();

        if (!otpDoc) {
            return res.status(400).json({ success: false, message: 'No active verification code found or it has expired' });
        }

        // prevent brute-force: check attempts
        if (otpDoc.attempts >= MAX_VERIFY_ATTEMPTS) {
            return res.status(429).json({ success: false, message: 'Too many attempts. Request a new code.' });
        }

        const match = await bcrypt.compare(String(code), otpDoc.codeHash);
        if (!match) {
            otpDoc.attempts = (otpDoc.attempts || 0) + 1;
            await otpDoc.save();
            return res.status(400).json({ success: false, verified: false, message: 'Invalid code' });
        }

        // Mark verified
        otpDoc.verified = true;
        await otpDoc.save();

        // Optionally: mark user email as verified in your User model
        // Example:
        // await User.updateOne({ email }, { $set: { emailVerified: true } });

        return res.status(200).json({ success: true, verified: true, message: 'Email verified' });
    } catch (err) {
        console.error('verifyCode error', err);
        return res.status(500).json({ success: false, message: 'Verification failed' });
    }
};
