const mongoose = require("mongoose");

const shopAuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    action: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

shopAuditLogSchema.index({ shopId: 1, timestamp: -1 });

module.exports = mongoose.model("ShopAuditLog", shopAuditLogSchema);
