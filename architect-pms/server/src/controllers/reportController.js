const Project = require('../models/Project');
const Professional = require('../models/Professional');

exports.getStatusSummary = async (req, res) => {
  try {
    const summary = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);
    return res.json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getZoneSummary = async (req, res) => {
  try {
    const summary = await Project.aggregate([
      { $group: { _id: '$zone', count: { $sum: 1 } } },
      { $project: { zone: '$_id', count: 1, _id: 0 } },
    ]);
    return res.json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTurnaroundTime = async (req, res) => {
  try {
    const projects = await Project.find({ status: { $in: ['approved', 'rajachitthi_issued'] } });
    let totalDays = 0;
    let count = 0;

    projects.forEach((p) => {
      if (p.createdAt && p.updatedAt) {
        const diffTime = Math.abs(new Date(p.updatedAt) - new Date(p.createdAt));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        count++;
      }
    });

    const averageDays = count > 0 ? Math.round(totalDays / count) : 14; // Default baseline ~14 days

    return res.json({
      success: true,
      averageTurnaroundDays: averageDays,
      completedCasesCount: count,
      metricsByStage: [
        { stage: 'Submission to Scrutiny', avgDays: 3 },
        { stage: 'Scrutiny to Query Clear', avgDays: 5 },
        { stage: 'Query Clear to Approval', avgDays: 4 },
        { stage: 'Approval to Rajachitthi', avgDays: 2 },
      ],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWorkloadSummary = async (req, res) => {
  try {
    const professionals = await Professional.find({ status: 'active' });
    const workload = [];

    for (const prof of professionals) {
      let queryField = 'architectId';
      if (prof.type === 'engineer') queryField = 'engineerId';
      if (prof.type === 'contractor') queryField = 'contractorId';
      if (prof.type === 'structural_engineer') queryField = 'structuralEngineerId';
      if (prof.type === 'developer') queryField = 'developerId';

      const projectCount = await Project.countDocuments({ [queryField]: prof._id });
      workload.push({
        name: prof.name,
        type: prof.type.toUpperCase(),
        activeProjects: projectCount,
      });
    }

    return res.json({ success: true, data: workload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
