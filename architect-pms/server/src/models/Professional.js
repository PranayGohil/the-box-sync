const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['architect', 'engineer', 'contractor', 'structural_engineer', 'sor', 'developer'],
    },
    name: { type: String, required: true, trim: true },
    licenseNo: { type: String, required: true, trim: true },
    licenseIssueDate: { type: Date, required: true },
    licenseExpiryDate: { type: Date, required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Professional', professionalSchema);
