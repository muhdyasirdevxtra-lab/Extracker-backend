const express = require('express');
const router = express.Router();
const { addSalary, getSalaries, updateSalary, getSalaryStatus, getArchives } = require('../controllers/salaryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, addSalary).get(protect, getSalaries);
router.route('/status').get(protect, getSalaryStatus);
router.route('/archives').get(protect, getArchives);
router.route('/:id').put(protect, updateSalary);

module.exports = router;
