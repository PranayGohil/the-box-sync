const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const staffPayrollSchema = new Schema(
  {
    staff_id: {
      type: Schema.Types.ObjectId,
      ref: "staff",
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },

    // ── Period ────────────────────────────────────────────────────────────────
    month: {
      type: Number, // 1–12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },

    // ── Salary Inputs ─────────────────────────────────────────────────────────
    // ── Salary Breakdowns ─────────────────────────────────────────────────────
    earned_breakdown: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      special: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      total_gross: { type: Number, default: 0 }
    },
    deduction_breakdown: {
      pf: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      pt: { type: Number, default: 200 },
      total_statutory: { type: Number, default: 0 }
    },
    working_days_in_month: {
      type: Number, // total working days defined for that month (e.g. 26)
      required: true,
      default: 26,
    },

    // ── Attendance Derived ────────────────────────────────────────────────────
    leave_summary: {
      paid_leave_days: { type: Number, default: 0 },
      lwp_days: { type: Number, default: 0 },
      holiday_days: { type: Number, default: 0 },
      week_off_days: { type: Number, default: 0 },
      comp_off_days: { type: Number, default: 0 },
      total_paid_days: { type: Number, default: 0 } // present + half_day + paid_leave + holidays + week_offs + comp_offs
    },
    present_days: {
      type: Number,
      default: 0,
    },
    absent_days: {
      type: Number,
      default: 0,
    },

    // ── Deductions Extended ───────────────────────────────────────────────────
    advance_deduction: {
      type: Number,
      default: 0
    },
    lwp_deduction: {
      type: Number,
      default: 0
    },
    tds: {
      type: Number,
      default: 0
    },

    // ── Overtime ──────────────────────────────────────────────────────────────
    overtime_hours: {
      type: Number,
      default: 0,
    },
    overtime_rate: {
      type: Number, // per hour rate — copied from staff at time of generation
      default: 0,
    },
    overtime_pay: {
      type: Number,
      default: 0,
    },

    // ── Adjustments ───────────────────────────────────────────────────────────
    bonus: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    deduction_reason: {
      type: String,
      default: "",
    },

    // ── Calculated ────────────────────────────────────────────────────────────
    // net_salary = earned_breakdown.total_gross + overtime_pay + bonus - total_statutory - manual_deductions
    // net_salary = earned_salary + overtime_pay + bonus - deductions
    net_salary: {
      type: Number,
      default: 0,
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    paid_date: {
      type: String,
      default: null,
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

// One payroll record per staff per month/year
staffPayrollSchema.index({ staff_id: 1, month: 1, year: 1 }, { unique: true });

// Fast monthly summary queries
staffPayrollSchema.index({ user_id: 1, month: 1, year: 1 });

// Fast per-staff history queries
staffPayrollSchema.index({ staff_id: 1, year: 1, month: 1 });

const StaffPayroll = mongoose.model("staffPayroll", staffPayrollSchema);
module.exports = StaffPayroll;