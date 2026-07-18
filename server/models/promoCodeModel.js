const mongoose = require("mongoose");
const { Schema } = mongoose;

const promoCodeSchema = new Schema({
  user_id: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  discountType: { type: String, enum: ['flat', 'percentage', 'bogo', 'free_item'], required: true },
  discountValue: { type: Number, default: 0 },
  minOrderValue: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number, default: null }, // for capping percentage discounts
  freeItemDescription: { type: String, default: '' }, // e.g. "Free Coke"
  activationDate: { type: Date, default: null },
  expiryDate: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// A user shouldn't have duplicate promo codes
promoCodeSchema.index({ user_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("promo_code", promoCodeSchema);
