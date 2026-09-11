const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', reminderController.getReminders);
router.patch('/:id/status', reminderController.updateReminderStatus);
router.post('/refresh', reminderController.refreshReminders);

module.exports = router;
