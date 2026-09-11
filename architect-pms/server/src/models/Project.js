const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    caseNo: { type: String, required: true, unique: true, trim: true },
    rajachitthiNo: { type: String, default: '', trim: true },
    rajachitthiDate: { type: Date, default: null },
    ownerName: { type: String, required: true, trim: true },
    projectName: { type: String, required: true, trim: true },
    blockNo: { type: String, default: '', trim: true },
    tpsNo: { type: String, default: '', trim: true },
    rsNo: { type: String, default: '', trim: true },
    fpNo: { type: String, default: '', trim: true },
    csNo: { type: String, default: '', trim: true },
    spNo: { type: String, default: '', trim: true },
    zone: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },

    architectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', default: null },
    engineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', default: null },
    contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', default: null },
    structuralEngineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', default: null },
    sorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', default: null },
    developerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', default: null },

    status: {
      type: String,
      enum: ['submitted', 'under_scrutiny', 'query_raised', 'approved', 'rejected', 'rajachitthi_issued'],
      default: 'submitted',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        date: { type: Date, default: Date.now },
        remark: { type: String, default: '' },
        updatedBy: { type: String, default: 'System' },
      },
    ],
    documents: [
      {
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        type: { type: String, default: 'drawing' },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: String, default: 'User' },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
