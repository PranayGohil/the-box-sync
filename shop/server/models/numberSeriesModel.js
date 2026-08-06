const mongoose = require('mongoose');

const numberSeriesSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  docType: { type: String, enum: ['Invoice', 'SalesOrder', 'PurchaseOrder', 'CreditNote', 'DebitNote'], required: true },
  prefix: { type: String, required: true },
  currentSequence: { type: Number, default: 0 },
  digits: { type: Number, default: 4 }
}, { timestamps: true });

numberSeriesSchema.index({ shopId: 1, docType: 1 }, { unique: true });

module.exports = mongoose.model('NumberSeries', numberSeriesSchema);
