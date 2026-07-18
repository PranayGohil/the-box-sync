const express = require("express");
const router = express.Router();
const promoCodeController = require("../controllers/promoCodeController");
const authMiddleware = require("../middlewares/auth-middlewares");

// Get all promo codes
router.post("/list", authMiddleware, promoCodeController.getPromoCodes);

// Validate promo code
router.post("/validate", authMiddleware, promoCodeController.validatePromoCode);

// Create promo code
router.post("/", authMiddleware, promoCodeController.createPromoCode);

// Update promo code
router.put("/:id", authMiddleware, promoCodeController.updatePromoCode);

// Toggle active status
router.put("/toggle/:id", authMiddleware, promoCodeController.togglePromoCode);

// Delete promo code
router.delete("/:id", authMiddleware, promoCodeController.deletePromoCode);

module.exports = router;
