const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leaveBalanceSchema = new Schema(
  {
    staff_id: {
      type: Schema.Types.ObjectId,
      ref: "staff",
      required: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    },
    balances: [
      {
        leave_type_id: { type: String, required: true },
        entitled: { type: Number, default: 0 }, // Total days allowed for the year
        taken: { type: Number, default: 0 },    // Approved and taken
        pending: { type: Number, default: 0 },  // Applied but not yet approved
        carried_forward: { type: Number, default: 0 } // Carried from previous year
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Virtual for remaining balance
leaveBalanceSchema.virtual('balances.remaining').get(function() {
  return (this.entitled + this.carried_forward) - this.taken - this.pending;
});

// Ensure one record per staff per year
leaveBalanceSchema.index({ staff_id: 1, year: 1 }, { unique: true });

const LeaveBalance = mongoose.model("leaveBalance", leaveBalanceSchema);
module.exports = LeaveBalance;
