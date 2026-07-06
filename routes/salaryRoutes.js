const express = require('express');
const router = express.Router();
const { addSalary, getSalaries, updateSalary } = require('../controllers/salaryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, addSalary).get(protect, getSalaries);
router.route('/:id').put(protect, updateSalary);

module.exports = router;
