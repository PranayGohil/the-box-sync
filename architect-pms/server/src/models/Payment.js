const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    type: {
      type: String,
      enum: ['architect_fee', 'govt_fee'],
      required: true,
    },
    amountDue: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, required: true, default: 0 },
    dueDate: { type: Date, default: null },
    paymentHistory: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        method: { type: String, default: 'bank_transfer' },
        remark: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
