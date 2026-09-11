const mongoose = require('mongoose');

const progressStageSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    stage: {
      type: String,
      required: true,
      enum: ['foundation', 'plinth', 'middle_story', 'top_slab'],
    },
    completionDate: { type: Date, default: Date.now },
    remarks: { type: String, default: '' },
    photos: [{ type: String }],
    updatedBy: { type: String, default: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProgressStage', progressStageSchema);
