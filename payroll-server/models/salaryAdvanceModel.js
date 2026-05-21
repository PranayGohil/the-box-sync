const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const salaryAdvanceSchema = new Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    given_date: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    recovery_mode: {
      type: String,
      enum: ["single", "installments"],
      default: "single",
    },
    installments: {
      type: Number,
      default: 1, // If recovery_mode is single, this is 1
    },
    installment_amount: {
      type: Number,
      default: function() { return this.amount; }
    },
    recovered_amount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "fully_recovered", "cancelled"],
      default: "active",
    },
    notes: {
      type: String,
      default: "",
    }
  },
  {
    timestamps: true,
  }
);

const SalaryAdvance = mongoose.model("salaryAdvance", salaryAdvanceSchema);
module.exports = SalaryAdvance;
