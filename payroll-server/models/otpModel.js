// models/Otp.model.js
const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },
    codeHash: { type: String, required: true }, // bcrypt hashed OTP
    purpose: { type: String, default: 'email_verification' }, // allow reuse for other flows
    attempts: { type: Number, default: 0 }, // number of verification attempts
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
    resendCount: { type: Number, default: 0 },
});

// TTL index: document will be removed after expiresAt passes
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// optional compound index to quickly find latest by email+purpose
OtpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

module.exports = mongoose.model('Otp', OtpSchema);
