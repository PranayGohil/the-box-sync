const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const { kioskLogin, kioskMe, sendOtp, verifyOtp } = require("../controllers/kioskController");

const kioskRouter = express.Router();

// ── OTP Login Flow (passwordless) ─────────────────────────────────────────────
kioskRouter.post("/send-otp", sendOtp);       // Step 1: request OTP via email
kioskRouter.post("/verify-otp", verifyOtp);   // Step 2: verify OTP, get JWT

// Legacy password login — kept for backward compatibility (returns error)
kioskRouter.post("/login", kioskLogin);

// Protected — requires the kiosk JWT issued on login
kioskRouter.get("/me", authMiddleware, kioskMe);

module.exports = kioskRouter;
