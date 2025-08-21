const express = require('express');
const ReportController = require('../controllers/ReportController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All report routes require authentication
router.use(authMiddleware);

// Report endpoints
router.get('/daily', ReportController.getDailyReport);
router.get('/weekly', ReportController.getWeeklyReport);
router.get('/stats', ReportController.getCompletionStats);
router.get('/export/:format', ReportController.exportData);

module.exports = router;
