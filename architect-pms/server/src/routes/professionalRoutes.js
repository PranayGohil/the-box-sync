const express = require('express');
const router = express.Router();
const professionalController = require('../controllers/professionalController');
const { authenticateToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticateToken);

router.get('/', professionalController.getProfessionals);
router.post('/', checkRole(['admin', 'architect', 'staff']), professionalController.createProfessional);
router.put('/:id', checkRole(['admin', 'architect', 'staff']), professionalController.updateProfessional);
router.delete('/:id', checkRole(['admin']), professionalController.deleteProfessional);
router.post('/bulk-import', checkRole(['admin', 'architect']), upload.single('file'), professionalController.bulkImport);

module.exports = router;
