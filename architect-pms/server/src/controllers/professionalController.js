const Professional = require('../models/Professional');
const { logAudit } = require('../middleware/audit');
const xlsx = require('xlsx');

exports.getProfessionals = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    let query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { licenseNo: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const professionals = await Professional.find(query).sort({ name: 1 });
    return res.json({ success: true, count: professionals.length, data: professionals });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProfessional = async (req, res) => {
  try {
    const professional = await Professional.create(req.body);
    await logAudit({
      user: req.user,
      action: 'CREATE_PROFESSIONAL',
      entityType: 'Professional',
      entityId: professional._id,
      changesSummary: `Added ${professional.type}: ${professional.name} (Lic No: ${professional.licenseNo})`,
    });
    return res.status(201).json({ success: true, data: professional });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateProfessional = async (req, res) => {
  try {
    const professional = await Professional.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }
    await logAudit({
      user: req.user,
      action: 'UPDATE_PROFESSIONAL',
      entityType: 'Professional',
      entityId: professional._id,
      changesSummary: `Updated ${professional.name}`,
    });
    return res.json({ success: true, data: professional });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteProfessional = async (req, res) => {
  try {
    const professional = await Professional.findByIdAndDelete(req.params.id);
    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }
    await logAudit({
      user: req.user,
      action: 'DELETE_PROFESSIONAL',
      entityType: 'Professional',
      entityId: req.params.id,
      changesSummary: `Deleted ${professional.name}`,
    });
    return res.json({ success: true, message: 'Professional deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No Excel/CSV file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const created = [];
    for (const row of rows) {
      const type = (row.type || row.Type || 'architect').toLowerCase().replace(/\s+/g, '_');
      const name = row.name || row.Name || row['Full Name'];
      const licenseNo = row.licenseNo || row.LicenseNo || row['License No'] || `LIC-${Date.now()}`;
      const phone = row.phone || row.Phone || row['Contact'] || '9876543210';
      const email = row.email || row.Email || 'contact@example.com';
      const issueDate = row.licenseIssueDate || row['Issue Date'] || new Date();
      const expiryDate = row.licenseExpiryDate || row['Expiry Date'] || new Date(Date.now() + 365 * 86400000);

      if (name) {
        const item = await Professional.create({
          type,
          name,
          licenseNo,
          licenseIssueDate: new Date(issueDate),
          licenseExpiryDate: new Date(expiryDate),
          phone,
          email,
          status: 'active',
        });
        created.push(item);
      }
    }

    await logAudit({
      user: req.user,
      action: 'BULK_IMPORT_PROFESSIONALS',
      entityType: 'Professional',
      entityId: '',
      changesSummary: `Bulk imported ${created.length} professional records from ${req.file.originalname}`,
    });

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${created.length} professionals`,
      data: created,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
