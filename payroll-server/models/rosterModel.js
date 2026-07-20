const mongoose = require("mongoose");

const rosterSchema = new mongoose.Schema(
  {
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    date: {
      type: String,
      required: true,
      // Date in DD/MM/YYYY format
    },
    shift_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null, // null means they are assigned an 'off' day or fallback to default
    },
    is_off: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

// Ensure a staff member only has one roster entry per date
rosterSchema.index({ staff_id: 1, date: 1 }, { unique: true });

const Roster = mongoose.model("Roster", rosterSchema);

module.exports = Roster;
