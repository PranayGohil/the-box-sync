const mongoose = require('mongoose');
const { ROLES, DEFAULT_ROLE_PERMISSIONS } = require('../config/constants');

const businessMemberSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.OWNER },
  customRoleName: { type: String },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  branchAccess: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
  warehouseAccess: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' }],
  isAllBranches: { type: Boolean, default: true },
  isAllWarehouses: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'inactive', 'invited'], default: 'active' },
  invitedEmail: { type: String }
}, {
  timestamps: true
});

businessMemberSchema.index({ businessId: 1, userId: 1 }, { unique: true });
businessMemberSchema.index({ userId: 1 });

businessMemberSchema.pre('save', function(next) {
  if (this.isModified('role') && (!this.permissions || Object.keys(this.permissions).length === 0)) {
    this.permissions = DEFAULT_ROLE_PERMISSIONS[this.role] || {};
  }
  next();
});

module.exports = mongoose.model('BusinessMember', businessMemberSchema);
