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
  position: {
    type: String,
  },
  salary: {
    type: Number,
  },
  salary_structure: {
    earnings: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      special: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
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