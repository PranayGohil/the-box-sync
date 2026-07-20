const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const shiftSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    start_time: {
      type: String, // format e.g., "09:00 AM"
      required: true,
    },
    end_time: {
      type: String, // format e.g., "06:00 PM"
      required: true,
    },
    late_threshold_minutes: {
      type: Number,
      default: 0,
    },
    user_id: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

shiftSchema.index({ user_id: 1, name: 1 }, { unique: true });

const Shift = mongoose.model("shift", shiftSchema);
module.exports = Shift;
