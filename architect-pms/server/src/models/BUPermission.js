const mongoose = require('mongoose');

const buPermissionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    status: {
      type: String,
      enum: ['not_started', 'application_submitted', 'under_review', 'approved', 'rejected'],
      default: 'not_started',
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
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('BUPermission', buPermissionSchema);
