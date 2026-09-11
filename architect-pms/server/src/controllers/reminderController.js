const Reminder = require('../models/Reminder');
const Professional = require('../models/Professional');
const Project = require('../models/Project');
const SiteVisit = require('../models/SiteVisit');
const BUPermission = require('../models/BUPermission');
const { formatDateDDMMYYYY } = require('../utils/dateFormatter');

exports.getReminders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    // Run quick background sync to catch any new automated items
    await generateAutoReminders();

    const reminders = await Reminder.find(query).sort({ dueDate: 1 });
    return res.json({ success: true, count: reminders.length, data: reminders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReminderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }
    return res.json({ success: true, data: reminder });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.refreshReminders = async (req, res) => {
  try {
    const count = await generateAutoReminders();
    return res.json({ success: true, message: 'Reminders scanner executed', newRemindersCount: count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generateAutoReminders = async () => {
  let createdCount = 0;
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 1. License Expiry Reminders
  const expiringProfessionals = await Professional.find({
    licenseExpiryDate: { $lte: thirtyDaysFromNow },
    status: 'active',
  });

  for (const prof of expiringProfessionals) {
    const existing = await Reminder.findOne({
      type: 'license_expiry',
      refId: prof._id,
    });
    if (!existing) {
      await Reminder.create({
        type: 'license_expiry',
        refId: prof._id,
        title: `License Expiry Alert: ${prof.name} (${prof.type.toUpperCase()})`,
        description: `License ${prof.licenseNo} expires on ${formatDateDDMMYYYY(prof.licenseExpiryDate)}`,
        dueDate: prof.licenseExpiryDate,
        status: 'pending',
        channel: 'email',
      });
      createdCount++;
    }
  }

  // 2. Site Visit Reminders
  const upcomingVisits = await SiteVisit.find({
    scheduledDate: { $lte: thirtyDaysFromNow },
    status: 'scheduled',
  }).populate('projectId');

  for (const visit of upcomingVisits) {
    const existing = await Reminder.findOne({
      type: 'site_visit',
      refId: visit._id,
    });
    if (!existing && visit.projectId) {
      await Reminder.create({
        type: 'site_visit',
        refId: visit._id,
        title: `Upcoming Site Visit: Case ${visit.projectId.caseNo} (${visit.projectId.projectName})`,
        description: `Scheduled for ${formatDateDDMMYYYY(visit.scheduledDate)} - Purpose: ${visit.purpose}`,
        dueDate: visit.scheduledDate,
        status: 'pending',
        channel: 'in_app',
      });
      createdCount++;
    }
  }

  return createdCount;
};
