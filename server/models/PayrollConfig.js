const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payrollConfigSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true, // One global config per tenant/user
    },
    active_earnings: {
      type: [String],
      default: ["basic", "hra", "conveyance", "medical", "special", "other"],
    },
    statutory_deductions: {
      pf_percentage: { type: Number, default: 12 },
      esi_percentage: { type: Number, default: 0.75 },
      pt_amount: { type: Number, default: 200 },
    },
  },
  {
    timestamps: true,
  }
);

const PayrollConfig = mongoose.model("payrollconfig", payrollConfigSchema);
module.exports = PayrollConfig;
