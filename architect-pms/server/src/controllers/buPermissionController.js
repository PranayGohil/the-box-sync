const BUPermission = require('../models/BUPermission');
const ProgressStage = require('../models/ProgressStage');
const { logAudit } = require('../middleware/audit');

exports.getBUPermission = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if Top Slab stage is completed or exists
    const topSlabStage = await ProgressStage.findOne({ projectId, stage: 'top_slab' });
    const isUnlocked = !!topSlabStage;

    let buPermission = await BUPermission.findOne({ projectId });
    if (!buPermission) {
      buPermission = {
        projectId,
        status: 'not_started',
        statusHistory: [],
        documents: [],
      };
    }

    return res.json({
      success: true,
      isUnlocked,
      data: buPermission,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBUPermission = async (req, res) => {
  try {
    const projectId = req.params.id;
    let bu = await BUPermission.findOne({ projectId });

    if (bu) {
      return res.status(400).json({ success: false, message: 'B.U. Permission record already exists' });
    }

    bu = await BUPermission.create({
      projectId,
      status: 'application_submitted',
      statusHistory: [
        {
          status: 'application_submitted',
          date: new Date(),
          remark: 'B.U. Application submitted to municipal corporation',
          updatedBy: req.user.name || req.user.email,
        },
      ],
    });

    await logAudit({
      user: req.user,
      action: 'INITIATE_BU_PERMISSION',
      entityType: 'BUPermission',
      entityId: bu._id,
      changesSummary: `Submitted B.U. Permission application for project ${projectId}`,
    });

    return res.status(201).json({ success: true, data: bu });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateBUStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;
    const projectId = req.params.id;

    let bu = await BUPermission.findOne({ projectId });
    if (!bu) {
      bu = new BUPermission({ projectId, status: 'not_started', statusHistory: [], documents: [] });
    }

    bu.status = status;
    bu.statusHistory.push({
      status,
      date: new Date(),
      remark: remark || `Status changed to ${status}`,
      updatedBy: req.user.name || req.user.email,
    });

    await bu.save();

    await logAudit({
      user: req.user,
      action: 'UPDATE_BU_STATUS',
      entityType: 'BUPermission',
      entityId: bu._id,
      changesSummary: `B.U. Status changed to '${status}' for project ${projectId}`,
    });

    return res.json({ success: true, data: bu });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.uploadBUDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document uploaded' });
    }
    const projectId = req.params.id;
    let bu = await BUPermission.findOne({ projectId });

    if (!bu) {
      bu = new BUPermission({ projectId, status: 'not_started', statusHistory: [], documents: [] });
    }

    const doc = {
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      uploadedAt: new Date(),
    };

    bu.documents.push(doc);
    await bu.save();

    return res.json({ success: true, data: bu });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
