const express = require('express');
const router = express.Router();
const siteVisitController = require('../controllers/siteVisitController');
const { authenticateToken, checkRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', siteVisitController.getSiteVisits);
router.post('/', checkRole(['admin', 'architect', 'staff', 'site_engineer']), siteVisitController.createSiteVisit);
router.put('/:id', checkRole(['admin', 'architect', 'staff', 'site_engineer']), siteVisitController.updateSiteVisit);
router.delete('/:id', checkRole(['admin', 'architect']), siteVisitController.deleteSiteVisit);

module.exports = router;
