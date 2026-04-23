const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const staffAttendanceSchema = new Schema(
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
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "half_day", "leave", "holiday", "week_off", "comp_off"],
      default: "present"
    },
    leave_type_id: {
      type: String, // Reference if status === 'leave'
      default: null
    },
    in_time: {
      type: String,
      default: null,
    },
    out_time: {
      type: String,
      default: null,
    },
    late_by_minutes: {
      type: Number,
      default: 0
    },
    overtime_hours: {
      type: Number,
      default: 0
    },
    is_manual_entry: {
      type: Boolean,
      default: false
    },
    manual_entry_reason: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records for same staff on same date
staffAttendanceSchema.index({ staff_id: 1, date: 1 }, { unique: true });

// Fast lookup: all attendance for a user in a date range
staffAttendanceSchema.index({ user_id: 1, date: 1 });

const StaffAttendance = mongoose.model("staff-attendance", staffAttendanceSchema);
module.exports = StaffAttendance;