const PromoCode = require("../models/promoCodeModel");

const getPromoCodes = async (req, res) => {
  try {
    const user_id = req.user?._id || req.body?.user_id;
    if (!user_id) return res.status(400).json({ success: false, message: "User ID is required" });

    // Automatically deactivate expired promo codes
    const now = new Date();
    await PromoCode.updateMany(
      { user_id, isActive: true, expiryDate: { $lt: now, $ne: null } },
      { $set: { isActive: false } }
    );

    const promoCodes = await PromoCode.find({ user_id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: promoCodes });
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return res.status(500).json({ success: false, message: "Error fetching promo codes" });
  }
};

const createPromoCode = async (req, res) => {
  try {
    const user_id = req.user?._id || req.body?.user_id;
    if (!user_id) return res.status(400).json({ success: false, message: "User ID is required" });

    const { 
      code, discountType, discountValue, isActive,
      minOrderValue, maxDiscountAmount, freeItemDescription,
      activationDate, expiryDate
    } = req.body;

    if (!code || !discountType) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existingCode = await PromoCode.findOne({ user_id, code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: "A promo code with this string already exists" });
    }

    const newCode = new PromoCode({
      user_id,
      code: code.toUpperCase(),
      discountType,
      discountValue: discountValue ? Number(discountValue) : 0,
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      freeItemDescription: freeItemDescription || '',
      activationDate: activationDate ? new Date(activationDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive: isActive !== undefined ? isActive : true
    });

    await newCode.save();
    return res.status(201).json({ success: true, data: newCode, message: "Promo code created successfully" });
  } catch (error) {
    console.error("Error creating promo code:", error);
    return res.status(500).json({ success: false, message: "Error creating promo code" });
  }
};

const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      code, discountType, discountValue, 
      minOrderValue, maxDiscountAmount, freeItemDescription,
      activationDate, expiryDate
    } = req.body;

    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return res.status(404).json({ success: false, message: "Promo code not found" });
    }

    if (code) {
      // Check if another code has this string
      const existing = await PromoCode.findOne({ user_id: promoCode.user_id, code: code.toUpperCase(), _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, message: "A promo code with this string already exists" });
      }
      promoCode.code = code.toUpperCase();
    }

    if (discountType) promoCode.discountType = discountType;
    if (discountValue !== undefined) promoCode.discountValue = Number(discountValue);
    if (minOrderValue !== undefined) promoCode.minOrderValue = Number(minOrderValue);
    if (maxDiscountAmount !== undefined) promoCode.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    if (freeItemDescription !== undefined) promoCode.freeItemDescription = freeItemDescription;
    if (activationDate !== undefined) promoCode.activationDate = activationDate ? new Date(activationDate) : null;
    if (expiryDate !== undefined) promoCode.expiryDate = expiryDate ? new Date(expiryDate) : null;

    await promoCode.save();
    return res.status(200).json({ success: true, data: promoCode, message: "Promo code updated successfully" });
  } catch (error) {
    console.error("Error updating promo code:", error);
    return res.status(500).json({ success: false, message: "Error updating promo code" });
  }
};

const togglePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return res.status(404).json({ success: false, message: "Promo code not found" });
    }

    promoCode.isActive = !promoCode.isActive;
    await promoCode.save();

    return res.status(200).json({ success: true, data: promoCode, message: "Promo code status updated" });
  } catch (error) {
    console.error("Error toggling promo code:", error);
    return res.status(500).json({ success: false, message: "Error toggling promo code" });
  }
};

const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PromoCode.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Promo code not found" });
    }
    return res.status(200).json({ success: true, message: "Promo code deleted successfully" });
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return res.status(500).json({ success: false, message: "Error deleting promo code" });
  }
};

const validatePromoCode = async (req, res) => {
  try {
    const user_id = req.user?._id || req.body?.user_id;
    if (!user_id) return res.status(400).json({ success: false, message: "User ID is required" });

    const { code, subTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Promo code is required" });

    const promoCode = await PromoCode.findOne({ user_id, code: code.toUpperCase() });
    
    if (!promoCode) {
      return res.status(404).json({ success: false, message: "Invalid promo code" });
    }

    const now = new Date();
    if (promoCode.activationDate && now < promoCode.activationDate) {
      return res.status(400).json({ success: false, message: "This promo code is not yet active" });
    }
    if (promoCode.expiryDate && now > promoCode.expiryDate) {
      return res.status(400).json({ success: false, message: "This promo code has expired" });
    }

    if (!promoCode.isActive) {
      return res.status(400).json({ success: false, message: "This promo code is no longer active" });
    }

    if (promoCode.minOrderValue > 0 && subTotal < promoCode.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum order amount of ₹${promoCode.minOrderValue} not met` 
      });
    }

    return res.status(200).json({ success: true, data: promoCode, message: "Promo code applied successfully" });
  } catch (error) {
    console.error("Error validating promo code:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  togglePromoCode,
  deletePromoCode,
  validatePromoCode
};
