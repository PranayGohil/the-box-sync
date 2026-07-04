const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const holidayInitSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

holidayInitSchema.index({ user_id: 1, year: 1 }, { unique: true });

const HolidayInit = mongoose.model("holiday_init", holidayInitSchema);
module.exports = HolidayInit;
