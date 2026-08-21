const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  managerName: { type: String, trim: true },
  contactNumber: { type: String, trim: true },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

warehouseSchema.index({ businessId: 1, code: 1 }, { unique: true });
warehouseSchema.index({ businessId: 1, isDefault: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
