const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dailyStockLog = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true, // normalized to midnight UTC
    },
    shift: {
      type: String,
      enum: ["opening", "closing"],
      required: true,
    },
    items: [
      {
        item_name: { type: String, required: true },
        unit: { type: String, default: "" },
        quantity: { type: Number, default: 0 }, // physical / system quantity
      },
    ],
    // How this log was created:
    // "manager_verified" → manager did physical count
    // "partial"          → manager only logged wastage, no full count
    // "auto_generated"   → system created it automatically, no manager action
    log_status: {
      type: String,
      enum: ["manager_verified", "partial", "auto_generated"],
      default: "auto_generated",
    },
    notes: { type: String, default: "" },
    recorded_by: { type: String, default: "System" }, // "Manager" | "Admin" | "System"
    edited_by: { type: String, default: null },
    edited_at: { type: Date, default: null },
  },
  { timestamps: true }
);

// Unique: one opening and one closing per user per day
dailyStockLog.index({ user_id: 1, date: 1, shift: 1 }, { unique: true });
dailyStockLog.index({ user_id: 1, date: -1 });

const DailyStockLog = mongoose.model("dailyStockLog", dailyStockLog);
module.exports = DailyStockLog;
