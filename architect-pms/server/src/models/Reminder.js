const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['license_expiry', 'rajachitthi_expiry', 'site_visit', 'bu_pending'],
    },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'done', 'snoozed'],
      default: 'pending',
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'sms', 'whatsapp'],
      default: 'in_app',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);
