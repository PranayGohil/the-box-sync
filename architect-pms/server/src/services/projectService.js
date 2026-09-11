const Project = require('../models/Project');
const AppError = require('../utils/appError');
const storageService = require('./storage/storageService');

class ProjectService {
  async queryProjects(queryParams, currentUser) {
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
    } = queryParams;

    let query = {};

    // Role-based scoping for clients
    if (currentUser && currentUser.role === 'client') {
      query._id = { $in: currentUser.linkedClientProjectIds || [] };
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

    return {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: projects,
    };
  }

  async createProject(projectData, userId, files = []) {
    const existing = await Project.findOne({ caseNo: projectData.caseNo });
    if (existing) {
      throw new AppError('A project with this Case Number already exists.', 400);
    }

    // Process attached documents
    const documents = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const uploaded = await storageService.uploadFile(file);
        documents.push({
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
          type: file.mimetype || 'document',
          uploadedAt: new Date(),
          uploadedBy: userId,
        });
      }
    }

    const initialHistory = [{
      status: projectData.status || 'submitted',
      date: new Date(),
      remark: 'Project registered in system',
      updatedBy: userId,
    }];

    const newProject = await Project.create({
      ...projectData,
      status: projectData.status || 'submitted',
      statusHistory: initialHistory,
      documents,
      createdBy: userId,
    });

    return newProject;
  }

  async updateProjectStatus(projectId, status, remark, userId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    project.status = status;
    project.statusHistory.push({
      status,
      date: new Date(),
      remark: remark || `Status changed to ${status}`,
      updatedBy: userId,
    });

    await project.save();
    return project;
  }
}

module.exports = new ProjectService();
