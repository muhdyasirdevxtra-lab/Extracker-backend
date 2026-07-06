const express = require('express');
const router = express.Router();
const { getAccounts, updateAccount } = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getAccounts);
router.route('/:id').put(protect, updateAccount);

module.exports = router;
