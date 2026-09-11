const express = require('express');
const router = express.Router({ mergeParams: true });
const paymentController = require('../controllers/paymentController');
const { authenticateToken, checkRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', paymentController.getProjectPayments);
router.post('/', checkRole(['admin', 'architect', 'staff']), paymentController.createOrUpdatePayment);
router.post('/:paymentId/history', checkRole(['admin', 'architect', 'staff']), paymentController.addPaymentRecord);

module.exports = router;
