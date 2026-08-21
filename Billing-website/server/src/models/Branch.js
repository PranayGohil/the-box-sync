const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, required: true, trim: true },
  stateCode: { type: String, required: true, trim: true },
  pincode: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  gstin: { type: String, trim: true, uppercase: true },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

branchSchema.index({ businessId: 1, code: 1 }, { unique: true });
branchSchema.index({ businessId: 1, isDefault: 1 });

module.exports = mongoose.model('Branch', branchSchema);
