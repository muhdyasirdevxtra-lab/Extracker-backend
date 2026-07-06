const express = require('express');
const router = express.Router();
const { getSavings, addSavings, updateSavings } = require('../controllers/savingsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getSavings).post(protect, addSavings);
router.route('/:id').put(protect, updateSavings);

module.exports = router;
