const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payrollConfigSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true, // One global config per tenant/user
    },
    // ── Active Earning Modules ──────────────────────────────────────────
    active_earnings: {
      type: [String],
      default: ["basic", "hra", "conveyance", "medical", "special", "other"],
    },
    
    // ── Statutory Deductions (Fully Configurable) ──────────────────────
    statutory_config: {
      pf: {
        is_mandatory: { type: Boolean, default: false },
        employee_percentage: { type: Number, default: 12 },
        employer_percentage: { type: Number, default: 12 },
        salary_limit: { type: Number, default: 15000 }, // Apply only if Basic > limit, or 0 to force for all
        auto_calculate: { type: Boolean, default: true }
      },
      esi: {
        is_mandatory: { type: Boolean, default: false },
        employee_percentage: { type: Number, default: 0.75 },
        employer_percentage: { type: Number, default: 3.25 },
        gross_limit: { type: Number, default: 21000 }, // Apply only if Gross <= limit
        auto_calculate: { type: Boolean, default: true }
      },
      pt: {
        is_applicable: { type: Boolean, default: false },
        state: { type: String, default: "" }, // e.g. 'karnataka', 'maharashtra'
        slabs: [
          {
            min_salary: Number,
            max_salary: Number,
            amount: Number
          }
        ] // Admin defined PT slabs based on state rules
      }
    },

    // ── Organizational Rules ────────────────────────────────────────────
    org_rules: {
      leave_year_start: { type: String, enum: ["january", "april"], default: "january" },
      weekly_off_days: { type: [Number], default: [0] }, // 0=Sunday, 1=Monday... [0, 6] = Sun/Sat
      half_day_hours: { type: Number, default: 4 },
      full_day_hours: { type: Number, default: 8 }
    }
  },
  {
    timestamps: true,
  }
);

const PayrollConfig = mongoose.model("payrollconfig", payrollConfigSchema);
module.exports = PayrollConfig;
