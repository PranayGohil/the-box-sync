const mongoose = require('mongoose');

const financialYearSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true }, // e.g. "2025-26", "2026-27"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  lockedAt: { type: Date },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, {
  timestamps: true
});

financialYearSchema.index({ businessId: 1, name: 1 }, { unique: true });
financialYearSchema.index({ businessId: 1, isCurrent: 1 });

module.exports = mongoose.model('FinancialYear', financialYearSchema);
