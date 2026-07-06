const Expense = require('../models/Expense');

// @desc    Get all expenses for user
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    // Optional filtering
    const { startDate, endDate, category } = req.query;
    let query = { user: req.user._id };

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (category) {
      query.category = category;
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { amount, category, remark, date, paymentMethod } = req.body;
    let receiptImage = null;

    if (req.file) {
      receiptImage = `/uploads/${req.file.filename}`;
    }

    const expense = await Expense.create({
      user: req.user._id,
      amount,
      category,
      remark,
      date: date ? new Date(date) : Date.now(),
      paymentMethod,
      receiptImage
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense || expense.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { amount, category, remark, date, paymentMethod } = req.body;

    expense.amount = amount || expense.amount;
    expense.category = category || expense.category;
    expense.remark = remark || expense.remark;
    expense.date = date ? new Date(date) : expense.date;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;

    if (req.file) {
      expense.receiptImage = `/uploads/${req.file.filename}`;
    }

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense || expense.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense };
