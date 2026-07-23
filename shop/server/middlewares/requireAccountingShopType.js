const User = require('../models/userModel');

const ALLOWED_ACCOUNTING_SHOP_TYPES = [
  'electronic',
  'mobile',
  'laptop',
  'computer'
];

const isAccountingShopType = (shopType) => {
  if (!shopType) return false;
  const st = String(shopType).toLowerCase();
  const allowedKeywords = [
    'electronic',
    'mobile',
    'laptop',
    'computer',
    'hardware',
    'garment',
    'clothing',
    'jewellery',
    'stationery',
    'retail',
    'gift',
    'cosmetics',
    'beauty',
    'sports',
    'flower',
    'bouquet',
    'liquor',
    'wine',
    'medical',
    'pharmacy',
    'general store',
    'super market',
  ];
  return allowedKeywords.some((keyword) => st.includes(keyword));
};

const requireAccountingShopType = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Since req.user from JWT only contains _id and Role, we fetch the full user document
    const user = await User.findById(req.user._id).select('shop_type');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!isAccountingShopType(user.shop_type)) {
      return res.status(403).json({ 
        message: `Accounting features are not available for shop type: ${user.shop_type || 'Unknown'}` 
      });
    }

    next();
  } catch (error) {
    console.error("Accounting Middleware Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = requireAccountingShopType;
