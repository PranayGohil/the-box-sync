const mongoose = require('mongoose');

const accountGroupSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, uppercase: true },
  nature: { type: String, enum: ['Asset', 'Liability', 'Income', 'Expense', 'Equity'], required: true },
  parentGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountGroup' },
  isSystem: { type: Boolean, default: false }
}, {
  timestamps: true
});

accountGroupSchema.index({ businessId: 1, name: 1 }, { unique: true });
accountGroupSchema.index({ businessId: 1, nature: 1 });

module.exports = mongoose.model('AccountGroup', accountGroupSchema);
