const mongoose = require('mongoose');

const chartOfAccountSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  accountCode: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountGroup', required: true },
  type: {
    type: String,
    enum: [
      'cash',
      'bank',
      'customer',
      'supplier',
      'sales',
      'sales_return',
      'purchase',
      'purchase_return',
      'gst_cgst_input',
      'gst_sgst_input',
      'gst_igst_input',
      'gst_cgst_output',
      'gst_sgst_output',
      'gst_igst_output',
      'expense',
      'tds_payable',
      'discount_allowed',
      'discount_received',
      'capital',
      'stock_in_hand',
      'general'
    ],
    default: 'general'
  },
  openingBalance: { type: Number, default: 0 },
  openingBalanceType: { type: String, enum: ['Dr', 'Cr'], default: 'Dr' },
  currentBalance: { type: Number, default: 0 }, // Optimized cached balance
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

chartOfAccountSchema.index({ businessId: 1, accountCode: 1 }, { unique: true });
chartOfAccountSchema.index({ businessId: 1, type: 1 });
chartOfAccountSchema.index({ businessId: 1, groupId: 1 });

module.exports = mongoose.model('ChartOfAccount', chartOfAccountSchema);
