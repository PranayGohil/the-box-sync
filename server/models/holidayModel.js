const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const holidaySchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    holiday_type: {
      type: String,
      enum: ["national", "public", "company", "optional"],
      default: "public",
    },
    is_paid: {
      type: Boolean,
      default: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookups for calendar queries
holidaySchema.index({ user_id: 1, year: 1, date: 1 });

const Holiday = mongoose.model("holiday", holidaySchema);
module.exports = Holiday;
