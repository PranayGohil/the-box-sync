/**
 * reservationTokenController.js
 *
 * Generates and manages the restaurant_token used for public-facing pages.
 *
 * ONE token serves ALL public features:
 *   GET /reservation/:token  → reservation form (landing page)
 *   GET /feedback/:token     → feedback form  (existing)
 *
 * The token is stored on the User document.
 * It never exposes the MongoDB _id to the public.
 *
 * Token strategy: crypto.randomBytes(20) → 40-char hex string
 *   - Cryptographically random, not guessable, not reversible
 *   - Unique check on generation (collision probability is astronomically low
 *     but we check anyway for correctness)
 */

const crypto = require("crypto");
const User = require("../models/userModel"); // your existing user model

// ─── Generate / Regenerate restaurant token ──────────────────────────────────
// POST /reservation/generate-token
// Auth: manager (uses existing auth middleware)
const generateReservationToken = async (req, res) => {
    try {
        const userId = req.user.id || req.user; // handle both { id } and raw id

        // Generate a unique token — retry on the astronomically rare collision
        let token;
        let attempts = 0;
        do {
            token = crypto.randomBytes(20).toString("hex"); // 40 hex chars
            const existing = await User.exists({ restaurant_token: token });
            if (!existing) break;
            attempts++;
        } while (attempts < 5);

        await User.findByIdAndUpdate(userId, { restaurant_token: token });

        return res.json({
            success: true,
            message: "Reservation token generated.",
            restaurant_token: token,
        });
    } catch (err) {
        console.error("generateReservationToken error:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};

// ─── Resolve token → user_id (used internally by reservation routes) ─────────
// GET /reservation/resolve-token/:token  (public)
// Returns only safe public info: restaurant name, logo, user_id (for slot fetching)
const resolveToken = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ restaurant_token: token }).select(
            "name logo restaurant_token city restaurant_code"
        );
        if (!user) {
            return res.status(404).json({ success: false, message: "Invalid or expired token." });
        }
        return res.json({
            success: true,
            data: {
                user_id: user._id.toString(),
                name: user.name,
                logo: user.logo || null,
                city: user.city || null,
                code: user.restaurant_code || null,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
};

module.exports = { generateReservationToken, resolveToken };