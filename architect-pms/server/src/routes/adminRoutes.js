const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, checkRole } = require('../middleware/auth');

router.use(authenticateToken);
router.use(checkRole(['admin']));

router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
