const express = require('express');
const router = express.Router({ mergeParams: true });
const progressController = require('../controllers/progressController');
const { authenticateToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticateToken);

router.get('/', progressController.getProjectProgress);
router.post('/', checkRole(['admin', 'architect', 'staff', 'site_engineer']), upload.array('photos', 5), progressController.addOrUpdateStage);

module.exports = router;
