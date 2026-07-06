const express = require('express');
const router = express.Router();
const { getDashboardSummary, getChartData, getSpendingTrend, getInsights } = require('../controllers/reportsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/summary').get(protect, getDashboardSummary);
router.route('/charts').get(protect, getChartData);
router.route('/trend').get(protect, getSpendingTrend);
router.route('/insights').get(protect, getInsights);

module.exports = router;
