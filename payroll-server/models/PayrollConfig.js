const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payrollConfigSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true, // One global config per tenant/user
    },
    // ── Network Restrictions ──────────────────────────────────────────
    network_restrictions: {
      is_enabled: { type: Boolean, default: false },
      allowed_ips: { type: [String], default: [] }
    },
    // ── Work From Home Settings ───────────────────────────────────────
    wfh_config: {
      min_interval: { type: Number, default: 3 }, // in minutes
      max_interval: { type: Number, default: 15 }, // in minutes
      idle_threshold: { type: Number, default: 5 } // in minutes
    },
    // ── Active Earning Modules ──────────────────────────────────────────
    custom_earnings: {
      type: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          is_active: { type: Boolean, default: true }
        }
      ],
      default: [
        { id: "basic", label: "Basic Salary", is_active: true },
        { id: "hra", label: "HRA", is_active: true },
        { id: "conveyance", label: "Conveyance", is_active: true },
        { id: "medical", label: "Medical Allowance", is_active: false },
        { id: "special", label: "Special Allowance", is_active: false },
        { id: "other", label: "Other Allowance", is_active: false }
      ]
    },
    
    // ── Active Deduction Modules ────────────────────────────────────────
    custom_deductions: {
      type: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          is_active: { type: Boolean, default: true }
        }
      ],
      default: [
        { id: "tds", label: "Income Tax (TDS)", is_active: false },
        { id: "loan", label: "Loan Recovery", is_active: false },
        { id: "advance", label: "Salary Advance", is_active: false },
        { id: "other_deduction", label: "Other Deduction", is_active: false }
      ]
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
      weekly_off_days: { type: [Number], default: [0] }, // Legacy
      half_day_hours: { type: Number, default: 4 },
      full_day_hours: { type: Number, default: 8 },
      lunch_start_time: { type: String, default: "01:00 PM" },
      lunch_end_time: { type: String, default: "02:00 PM" },
      // Attendance timing rules
      shift_start_time: { type: String, default: "09:00 AM" },        // Official shift start
      late_threshold_minutes: { type: Number, default: 0 },           // Grace period in minutes (0 = no grace)
      shift_end_time: { type: String, default: "06:00 PM" },          // Official shift end (for overtime)
      // Notice Period
      notice_period_days: { type: Number, default: 30 }
    },

    // ── Global Weekly Off Config ─────────────────────────────────────────
    global_weekly_offs: {
      type: [
        {
          day: { type: String, enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
          type: { type: String, enum: ['all_weeks', 'specific_weeks'], default: 'all_weeks' },
          weeks: [{ type: Number }]
        }
      ],
      default: [{ day: 'Sunday', type: 'all_weeks', weeks: [] }]
    },

    // ── Document Templates ──────────────────────────────────────────────
    document_templates: {
      joining_letter_template: { type: String, default: `<p>Dear [First Name] [Last Name],</p>
<p>We are delighted to offer you the position of <strong>[Job Title]</strong> at our company.</p>
<p>Your starting date will be <strong>[Date of Joining]</strong>.</p>
<p>Your basic salary will be <strong>[Basic Salary]</strong> per month.</p>
<p>Your Staff ID is <strong>[Staff ID]</strong>.</p>
<p><br></p>
<p>Please sign and return this letter to indicate your acceptance of this offer.</p>
<p><br></p>
<p>Sincerely,</p>
<p>HR Department</p>` },
      joining_letter_word: { type: String, default: null }
    }
  },
  {
    timestamps: true,
  }
);

const PayrollConfig = mongoose.model("payrollconfig", payrollConfigSchema);
module.exports = PayrollConfig;
