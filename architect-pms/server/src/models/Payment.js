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
    isEmi: { type: Boolean, default: false },
    emiPlan: {
      totalEmis: { type: Number, default: 1 },
      frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'milestone', 'custom'],
        default: 'monthly',
      },
      installments: [
        {
          installmentNo: { type: Number, required: true },
          name: { type: String, default: '' },
          amount: { type: Number, required: true },
          dueDate: { type: Date, default: null },
          paidAmount: { type: Number, default: 0 },
          status: {
            type: String,
            enum: ['pending', 'paid', 'partially_paid'],
            default: 'pending',
          },
          paidDate: { type: Date, default: null },
        },
      ],
    },
    paymentHistory: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        method: { type: String, default: 'bank_transfer' },
        remark: { type: String, default: '' },
        installmentNo: { type: Number, default: null },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
