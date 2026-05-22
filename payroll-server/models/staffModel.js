const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const addStaff = new Schema({
  staff_id: {
    type: String,
  },
  f_name: {
    type: String,
  },
  l_name: {
    type: String,
  },
  birth_date: {
    type: String,
  },
  joining_date: {
    type: String,
  },
  address: {
    type: String,
  },
  country: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  phone_no: {
    type: Number,
  },
  email: {
    type: String,
  },
  gender: {
    type: String,
  },
  pincode: {
    type: String,
  },
  position: {
    type: String,
  },
  salary: {
    type: Number,
  },
  salary_calculation_base: {
    type: String,
    enum: ['working_days', 'working_hours'],
    default: 'working_days'
  },
  weekly_off_policy: {
    type: String,
    enum: ['global', 'custom'],
    default: 'global'
  },
  custom_weekly_offs: {
    type: [
      {
        day: { type: String },
        type: { type: String, enum: ['all_weeks', 'specific_weeks'], default: 'all_weeks' },
        weeks: [{ type: Number }]
      }
    ],
    default: []
  },
  leave_policy_configuration: {
    type: [
      {
        leave_type_id: { type: String },
        is_active: { type: Boolean, default: true }
      }
    ],
    default: []
  },
  salary_structure: {
    custom_earnings: {
      type: Map,
      of: Number,
      default: {}
    },
    deductions: {
      pf_percentage: { type: Number, default: 12 },
      esi_percentage: { type: Number, default: 0 },
      pt: { type: Number, default: 200 }
    }
  },
  overtime_rate: {
    type: Number,
    default: 0,
  },
  increment_plan: {
    type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    value: { type: Number, default: 0 },
    scheduled_date: { type: String, default: "" },
    is_applied: { type: Boolean, default: false }
  },
  photo: {
    type: String,
  },
  document_type: {
    type: String,
  },
  id_number: {
    type: String,
  },
  front_image: {
    type: String,
  },
  back_image: {
    type: String,
  },
  face_encoding: {
    type: [Number],
    default: [],
  },
  face_embeddings: {
    type: [Number],
    default: [],
  },
  user_id: {
    type: String,
  },
  // ── Compliance & Bank Details ──────────────────────────────────────────────
  bank_account: {
    account_number: { type: String, default: "" },
    bank_name: { type: String, default: "" },
    ifsc_code: { type: String, default: "" },
    branch: { type: String, default: "" }
  },
  uan_number: { type: String, default: "" },    // EPF Universal Account Number
  esi_ip_number: { type: String, default: "" }, // ESI Insurance Number
});

// Indexes
addStaff.index({ user_id: 1, position: 1 });
addStaff.index({ user_id: 1, email: 1 }, { sparse: true });
addStaff.index({ user_id: 1, staff_id: 1 }, { sparse: true });
addStaff.index({ user_id: 1 });

const Staff = mongoose.model("staff", addStaff);
module.exports = Staff;