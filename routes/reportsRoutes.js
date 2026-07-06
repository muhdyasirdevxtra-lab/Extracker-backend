const express = require('express');
const router = express.Router();
const { getDashboardSummary, getChartData } = require('../controllers/reportsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/summary').get(protect, getDashboardSummary);
router.route('/charts').get(protect, getChartData);

module.exports = router;
