const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stockCorrectionRequestSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    requested_by: {
      type: String,
      required: true, // e.g. "Manager"
    },
    log_id: {
      type: Schema.Types.ObjectId,
      ref: "dailyStockLog",
      required: true,
    },
    log_date: {
      type: Date,
      required: true,
    },
    shift: {
      type: String,
      enum: ["opening", "closing"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    admin_notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("stockCorrectionRequest", stockCorrectionRequestSchema);
