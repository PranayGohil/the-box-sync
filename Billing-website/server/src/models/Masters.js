const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  parentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
categorySchema.index({ businessId: 1, name: 1 }, { unique: true });

const brandSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
brandSchema.index({ businessId: 1, name: 1 }, { unique: true });

const unitSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true }, // e.g. "Pieces", "Kilograms", "Boxes"
  symbol: { type: String, required: true, trim: true, uppercase: true }, // e.g. "PCS", "KGS", "BOX"
  uqc: { type: String, default: 'OTH' }, // GST Unit Quantity Code (e.g. PCS, KGS, BOX, NOS)
  allowDecimals: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
unitSchema.index({ businessId: 1, symbol: 1 }, { unique: true });

const hsnMasterSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' }, // Optional (can be global or tenant-specific)
  code: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  type: { type: String, enum: ['HSN', 'SAC'], default: 'HSN' },
  defaultRate: { type: Number, default: 18 }
}, { timestamps: true });
hsnMasterSchema.index({ code: 1, businessId: 1 });

const taxRateSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true }, // e.g. "GST 18%"
  rate: { type: Number, required: true },
  cgstRate: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  cessRate: { type: Number, default: 0 },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: { type: Date },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const taxRuleSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  condition: { type: String }, // e.g. "inter_state", "intra_state", "rcm", "export"
  taxRateId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxRate' },
  priority: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = {
  Category: mongoose.model('Category', categorySchema),
  Brand: mongoose.model('Brand', brandSchema),
  Unit: mongoose.model('Unit', unitSchema),
  HSNMaster: mongoose.model('HSNMaster', hsnMasterSchema),
  TaxRate: mongoose.model('TaxRate', taxRateSchema),
  TaxRule: mongoose.model('TaxRule', taxRuleSchema)
};
