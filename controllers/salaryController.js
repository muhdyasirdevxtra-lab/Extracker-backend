const Salary = require('../models/Salary');
const Expense = require('../models/Expense');

// @desc    Add or update salary
// @route   POST /api/salary
// @access  Private
const addSalary = async (req, res) => {
  const { amount, month, year } = req.body;

  try {
    const salary = await Salary.findOneAndUpdate(
      { user: req.user._id, month, year },
      { amount },
      { new: true, upsert: true }
    );

    res.status(200).json(salary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all salaries
// @route   GET /api/salary
// @access  Private
const getSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find({ user: req.user._id }).sort({ year: -1, month: -1 });
    res.json(salaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update salary (only if no expenses in that month)
// @route   PUT /api/salary/:id
// @access  Private
const updateSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary || salary.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Salary not found' });
    }

    // Check if expenses exist for this month/year
    const startDate = new Date(salary.year, salary.month - 1, 1);
    const endDate = new Date(salary.year, salary.month, 0); // last day of month
    
    const expensesCount = await Expense.countDocuments({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    if (expensesCount > 0) {
      return res.status(400).json({ message: 'Cannot edit salary after expenses are recorded for this month.' });
    }

    salary.amount = req.body.amount || salary.amount;
    const updatedSalary = await salary.save();
    res.json(updatedSalary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addSalary, getSalaries, updateSalary };
