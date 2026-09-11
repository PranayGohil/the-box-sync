const Project = require('../models/Project');
const Professional = require('../models/Professional');
const { logAudit } = require('../middleware/audit');
const { formatDateDDMMYYYY } = require('../utils/dateFormatter');
const xlsx = require('xlsx');

exports.getProjects = async (req, res) => {
  try {
    const {
      caseNo,
      projectName,
      zone,
      ward,
      status,
      architectId,
      engineerId,
      contractorId,
      structuralEngineerId,
      sorId,
      developerId,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    let query = {};

    // Client role restriction
    if (req.user && req.user.role === 'client') {
      query._id = { $in: req.user.linkedClientProjectIds || [] };
    }

    if (caseNo) query.caseNo = { $regex: caseNo, $options: 'i' };
    if (projectName) query.projectName = { $regex: projectName, $options: 'i' };
    if (zone) query.zone = zone;
    if (ward) query.ward = ward;
    if (status) query.status = status;
    if (architectId) query.architectId = architectId;
    if (engineerId) query.engineerId = engineerId;
    if (contractorId) query.contractorId = contractorId;
    if (structuralEngineerId) query.structuralEngineerId = structuralEngineerId;
    if (sorId) query.sorId = sorId;
    if (developerId) query.developerId = developerId;

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    if (search) {
      query.$or = [
        { caseNo: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { rajachitthiNo: { $regex: search, $options: 'i' } },
        { zone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('architectId', 'name licenseNo phone email')
      .populate('engineerId', 'name licenseNo phone email')
      .populate('contractorId', 'name licenseNo phone email')
      .populate('structuralEngineerId', 'name licenseNo phone email')
      .populate('sorId', 'name licenseNo phone email')
      .populate('developerId', 'name licenseNo phone email')
      .sort({ [sortBy]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: projects,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportProjectsExcel = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('architectId', 'name')
      .populate('engineerId', 'name')
      .populate('contractorId', 'name')
      .populate('structuralEngineerId', 'name')
      .populate('developerId', 'name');

    const dataRows = projects.map((p) => ({
      'Case No': p.caseNo,
      'Project Name': p.projectName,
      'Owner Name': p.ownerName,
      'Rajachitthi No': p.rajachitthiNo || 'N/A',
      'Rajachitthi Date': formatDateDDMMYYYY(p.rajachitthiDate),
      Zone: p.zone,
      Ward: p.ward,
      Status: p.status.toUpperCase(),
      Architect: p.architectId ? p.architectId.name : 'N/A',
      Engineer: p.engineerId ? p.engineerId.name : 'N/A',
      Contractor: p.contractorId ? p.contractorId.name : 'N/A',
      'Structural Eng': p.structuralEngineerId ? p.structuralEngineerId.name : 'N/A',
      Developer: p.developerId ? p.developerId.name : 'N/A',
      'Registered Date': formatDateDDMMYYYY(p.createdAt),
    }));

    const worksheet = xlsx.utils.json_to_sheet(dataRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Projects');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Architect_PMS_Projects.xlsx"');
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('architectId')
      .populate('engineerId')
      .populate('contractorId')
      .populate('structuralEngineerId')
      .populate('sorId')
      .populate('developerId');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project case not found' });
    }
    return res.json({ success: true, data: project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      createdBy: req.user.id,
      status: 'submitted',
      statusHistory: [
        {
          status: 'submitted',
          date: new Date(),
          remark: 'Initial case submission',
          updatedBy: req.user.name || req.user.email,
        },
      ],
    };

    const project = await Project.create(projectData);

    await logAudit({
      user: req.user,
      action: 'CREATE_PROJECT',
      entityType: 'Project',
      entityId: project._id,
      changesSummary: `Registered Case ${project.caseNo} for ${project.projectName} (${project.ownerName})`,
    });

    return res.status(201).json({ success: true, data: project });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await logAudit({
      user: req.user,
      action: 'UPDATE_PROJECT',
      entityType: 'Project',
      entityId: project._id,
      changesSummary: `Updated project metadata for Case ${project.caseNo}`,
    });

    return res.json({ success: true, data: project });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateProjectStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.status = status;
    project.statusHistory.push({
      status,
      date: new Date(),
      remark: remark || `Status transitioned to ${status}`,
      updatedBy: req.user.name || req.user.email,
    });

    await project.save();

    await logAudit({
      user: req.user,
      action: 'UPDATE_PROJECT_STATUS',
      entityType: 'Project',
      entityId: project._id,
      changesSummary: `Status changed to '${status}' for Case ${project.caseNo}. Remark: ${remark || 'N/A'}`,
    });

    return res.json({ success: true, data: project });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const newDoc = {
      fileUrl,
      fileName: req.file.originalname,
      type: req.body.type || 'drawing',
      uploadedAt: new Date(),
      uploadedBy: req.user.name || req.user.email,
    };

    project.documents.push(newDoc);
    await project.save();

    await logAudit({
      user: req.user,
      action: 'UPLOAD_PROJECT_DOCUMENT',
      entityType: 'Project',
      entityId: project._id,
      changesSummary: `Uploaded document '${req.file.originalname}' (${newDoc.type})`,
    });

    return res.json({ success: true, data: project.documents });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProjectBanner = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('architectId')
      .populate('engineerId')
      .populate('contractorId')
      .populate('structuralEngineerId')
      .populate('sorId')
      .populate('developerId');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const bannerData = {
      firmTitle: 'APEX ARCHITECTURAL & ENGINEERING ASSOCIATES',
      projectName: project.projectName,
      ownerName: project.ownerName,
      caseNo: project.caseNo,
      rajachitthiNo: project.rajachitthiNo || 'PENDING',
      rajachitthiDate: formatDateDDMMYYYY(project.rajachitthiDate),
      siteAddress: `Block ${project.blockNo || '-'}, TPS ${project.tpsNo || '-'}, RS ${project.rsNo || '-'}, FP ${project.fpNo || '-'}, Zone: ${project.zone}, Ward: ${project.ward}`,
      architect: project.architectId ? `${project.architectId.name} (Lic: ${project.architectId.licenseNo})` : 'N/A',
      engineer: project.engineerId ? `${project.engineerId.name} (Lic: ${project.engineerId.licenseNo})` : 'N/A',
      contractor: project.contractorId ? `${project.contractorId.name} (Lic: ${project.contractorId.licenseNo})` : 'N/A',
      structuralEngineer: project.structuralEngineerId ? `${project.structuralEngineerId.name} (Lic: ${project.structuralEngineerId.licenseNo})` : 'N/A',
      developer: project.developerId ? `${project.developerId.name} (Lic: ${project.developerId.licenseNo})` : 'N/A',
      status: project.status.toUpperCase(),
    };

    return res.json({ success: true, banner: bannerData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await logAudit({
      user: req.user,
      action: 'DELETE_PROJECT',
      entityType: 'Project',
      entityId: req.params.id,
      changesSummary: `Deleted project Case ${project.caseNo}`,
    });

    return res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
