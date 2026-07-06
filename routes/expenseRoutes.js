const express = require('express');
const router = express.Router();
const { getExpenses, addExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(protect, getExpenses)
  .post(protect, upload.single('receiptImage'), addExpense);

router.route('/:id')
  .put(protect, upload.single('receiptImage'), updateExpense)
  .delete(protect, deleteExpense);

module.exports = router;
