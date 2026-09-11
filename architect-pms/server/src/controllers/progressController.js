const ProgressStage = require('../models/ProgressStage');
const { logAudit } = require('../middleware/audit');

exports.getProjectProgress = async (req, res) => {
  try {
    const stages = await ProgressStage.find({ projectId: req.params.id }).sort({ createdAt: 1 });
    return res.json({ success: true, data: stages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addOrUpdateStage = async (req, res) => {
  try {
    const { stage, completionDate, remarks } = req.body;
    const projectId = req.params.id;

    let photos = [];
    if (req.files && req.files.length > 0) {
      photos = req.files.map((file) => `/uploads/${file.filename}`);
    }

    let progress = await ProgressStage.findOne({ projectId, stage });
    if (progress) {
      progress.completionDate = completionDate || Date.now();
      progress.remarks = remarks || progress.remarks;
      if (photos.length > 0) {
        progress.photos.push(...photos);
      }
      progress.updatedBy = req.user.name || req.user.email;
      await progress.save();
    } else {
      progress = await ProgressStage.create({
        projectId,
        stage,
        completionDate: completionDate || Date.now(),
        remarks: remarks || '',
        photos,
        updatedBy: req.user.name || req.user.email,
      });
    }

    await logAudit({
      user: req.user,
      action: 'UPDATE_PROGRESS_STAGE',
      entityType: 'ProgressStage',
      entityId: progress._id,
      changesSummary: `Updated construction stage '${stage}' for project ${projectId}`,
    });

    return res.json({ success: true, data: progress });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
