const Professional = require('../models/Professional');
const AppError = require('../utils/appError');

class ProfessionalService {
  async getProfessionals(type, search, status) {
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
    return await Professional.find(query).sort({ name: 1 });
  }

  async createProfessional(data) {
    if (data.licenseNo) {
      const existing = await Professional.findOne({ licenseNo: data.licenseNo, type: data.type });
      if (existing) {
        throw new AppError(`A ${data.type} with license number ${data.licenseNo} already exists.`, 400);
      }
    }
    return await Professional.create(data);
  }

  async bulkImport(records) {
    const inserted = [];
    const errors = [];

    for (const record of records) {
      try {
        if (!record.name || !record.type) {
          errors.push({ record, reason: 'Missing required fields (name, type)' });
          continue;
        }
        const created = await Professional.create({
          name: record.name,
          type: record.type.toLowerCase(),
          licenseNo: record.licenseNo || '',
          licenseIssueDate: record.licenseIssueDate ? new Date(record.licenseIssueDate) : null,
          licenseExpiryDate: record.licenseExpiryDate ? new Date(record.licenseExpiryDate) : null,
          phone: record.phone || '',
          email: record.email || '',
          status: record.status ? record.status.toLowerCase() : 'active',
        });
        inserted.push(created);
      } catch (err) {
        errors.push({ record, reason: err.message });
      }
    }

    return { insertedCount: inserted.length, errorCount: errors.length, errors, inserted };
  }
}

module.exports = new ProfessionalService();
