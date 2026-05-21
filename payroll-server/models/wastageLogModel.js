const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wastageLog = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    item_name: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    wastage_type: {
      type: String,
      enum: ["expired", "spillage", "damaged", "overcook", "theft", "other"],
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    logged_by: {
      type: String,
      default: "Manager", // "Manager" | "Admin"
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

wastageLog.index({ user_id: 1, date: -1 });
wastageLog.index({ user_id: 1, item_name: 1, date: -1 });

const WastageLog = mongoose.model("wastageLog", wastageLog);
module.exports = WastageLog;
