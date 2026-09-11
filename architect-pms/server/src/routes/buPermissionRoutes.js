const express = require('express');
const router = express.Router({ mergeParams: true });
const buPermissionController = require('../controllers/buPermissionController');
const { authenticateToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticateToken);

router.get('/', buPermissionController.getBUPermission);
router.post('/', checkRole(['admin', 'architect', 'staff']), buPermissionController.createBUPermission);
router.patch('/status', checkRole(['admin', 'architect', 'staff']), buPermissionController.updateBUStatus);
router.post('/documents', checkRole(['admin', 'architect', 'staff']), upload.single('file'), buPermissionController.uploadBUDocument);

module.exports = router;
