const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leaveRequestSchema = new Schema(
  {
    staff_id: {
      type: Schema.Types.ObjectId,
      ref: "staff",
      required: true,
      index: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    leave_type_id: {
      type: String,
      required: true,
    },
    from_date: {
      type: Date,
      required: true,
    },
    to_date: {
      type: Date,
      required: true,
    },
    days: {
      type: Number,
      required: true, // Auto-calculated excluding holidays/weekends based on config
    },
    is_half_day: {
      type: Boolean,
      default: false,
    },
    half_day_session: {
      type: String,
      enum: ["morning", "evening", "none"],
      default: "none",
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    applied_on: {
      type: Date,
      default: Date.now,
    },
    approved_by: {
      type: String,
      default: null,
    },
    approved_on: {
      type: Date,
      default: null,
    },
    rejection_reason: {
      type: String,
      default: "",
    },
    // Has this leave been marked in the daily attendance records yet?
    attendance_marked: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const LeaveRequest = mongoose.model("leaveRequest", leaveRequestSchema);
module.exports = LeaveRequest;
