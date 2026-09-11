const SiteVisit = require('../models/SiteVisit');
const { logAudit } = require('../middleware/audit');
const { formatDateDDMMYYYY } = require('../utils/dateFormatter');

exports.getSiteVisits = async (req, res) => {
  try {
    const { projectId, from, to, assignedTo, status } = req.query;
    let query = {};

    if (projectId) query.projectId = projectId;
    if (assignedTo) query.assignedTo = assignedTo;
    if (status) query.status = status;
    if (from || to) {
      query.scheduledDate = {};
      if (from) query.scheduledDate.$gte = new Date(from);
      if (to) query.scheduledDate.$lte = new Date(to);
    }

    const visits = await SiteVisit.find(query)
      .populate('projectId', 'caseNo projectName ownerName zone ward')
      .populate('assignedTo', 'name email role')
      .sort({ scheduledDate: 1 });

    return res.json({ success: true, count: visits.length, data: visits });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSiteVisit = async (req, res) => {
  try {
    const visit = await SiteVisit.create(req.body);
    await logAudit({
      user: req.user,
      action: 'CREATE_SITE_VISIT',
      entityType: 'SiteVisit',
      entityId: visit._id,
      changesSummary: `Scheduled site visit for project ${visit.projectId} on ${formatDateDDMMYYYY(visit.scheduledDate)}`,
    });
    return res.status(201).json({ success: true, data: visit });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateSiteVisit = async (req, res) => {
  try {
    const visit = await SiteVisit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Site visit not found' });
    }

    await logAudit({
      user: req.user,
      action: 'UPDATE_SITE_VISIT',
      entityType: 'SiteVisit',
      entityId: visit._id,
      changesSummary: `Updated site visit status to '${visit.status}'`,
    });

    return res.json({ success: true, data: visit });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteSiteVisit = async (req, res) => {
  try {
    const visit = await SiteVisit.findByIdAndDelete(req.params.id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Site visit not found' });
    }
    return res.json({ success: true, message: 'Site visit canceled' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
