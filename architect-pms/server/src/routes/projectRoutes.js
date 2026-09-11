const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticateToken);

router.get('/', projectController.getProjects);
router.get('/export', projectController.exportProjectsExcel);
router.get('/:id', projectController.getProjectById);
router.post('/', checkRole(['admin', 'architect', 'staff']), projectController.createProject);
router.put('/:id', checkRole(['admin', 'architect', 'staff']), projectController.updateProject);
router.delete('/:id', checkRole(['admin']), projectController.deleteProject);
router.patch('/:id/status', checkRole(['admin', 'architect', 'staff']), projectController.updateProjectStatus);
router.post('/:id/documents', checkRole(['admin', 'architect', 'staff', 'site_engineer']), upload.single('file'), projectController.uploadDocument);
router.get('/:id/banner', projectController.getProjectBanner);

module.exports = router;
