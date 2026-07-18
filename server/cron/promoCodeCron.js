const cron = require('node-cron');
const PromoCode = require('../models/promoCodeModel');

// Run every hour to check for expired promo codes and automatically disable them
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    
    const result = await PromoCode.updateMany(
      { isActive: true, expiryDate: { $lt: now, $ne: null } },
      { $set: { isActive: false } }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`[Cron] Automatically deactivated ${result.modifiedCount} expired promo codes.`);
    }
  } catch (error) {
    console.error('[Cron] Error deactivating expired promo codes:', error);
  }
});
