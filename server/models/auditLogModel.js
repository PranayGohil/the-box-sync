const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "superAdmin",
      required: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g., "LOGIN", "IMPERSONATE", "BLOCK_SUBSCRIPTION", "UPDATE_TAX"
    },
    targetId: {
      type: String, // Can be UserId, SubId, etc.
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

// Index for fast timeline queries
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ adminId: 1, timestamp: -1 });

const AuditLog = mongoose.model("auditLog", auditLogSchema);
module.exports = AuditLog;
