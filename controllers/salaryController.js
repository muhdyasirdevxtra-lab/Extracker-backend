const Salary = require('../models/Salary');
const Expense = require('../models/Expense');
const Savings = require('../models/Savings');
const MonthlyArchive = require('../models/MonthlyArchive');

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Archive the previous month's data.
 * The "previous cycle" is the one that just ended.
 * Cycle runs from the 6th of one month to the 5th of the next.
 * So on July 6th, we archive the "June cycle" (June 6 → July 5).
 */
const archivePreviousCycle = async (userId) => {
  const now = new Date();
  // The cycle that just ended is named after the month in which the 6th fell
  // e.g., On July 6th, the cycle "June 2026" (Jun 6 → Jul 5) just ended
  const prevMonth = now.getMonth(); // 0-indexed, so July = 6, we want June = 5
  const archiveMonth = prevMonth === 0 ? 12 : prevMonth; // Convert: if Jan(0) → archive Dec(12)
  const archiveYear = prevMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();

  // Check if already archived
  const existing = await MonthlyArchive.findOne({ user: userId, month: archiveMonth, year: archiveYear });
  if (existing) return existing; // Already archived, skip

  // Define the cycle date range: 6th of archiveMonth to 5th of current month
  const cycleStart = new Date(archiveYear, archiveMonth - 1, 6, 0, 0, 0); // e.g. June 6
  const cycleEnd = new Date(now.getFullYear(), now.getMonth(), 5, 23, 59, 59); // e.g. July 5

  // Get salary for the archived month
  const salary = await Salary.findOne({ user: userId, month: archiveMonth, year: archiveYear });
  const salaryAmount = salary ? salary.amount : 0;

  // Get expenses in the cycle range
  const expenses = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: cycleStart, $lte: cycleEnd } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);
  const expenseCount = expenses.reduce((sum, e) => sum + e.count, 0);
  const categoryBreakdown = expenses.map(e => ({ category: e._id, total: e.total }));

  // Get savings deposits in the cycle range
  const savingsData = await Savings.aggregate([
    { $match: { user: userId, date: { $gte: cycleStart, $lte: cycleEnd } } },
    { $group: {
      _id: null,
      totalDeposit: { $sum: { $cond: [{ $eq: ['$type', 'Deposit'] }, '$amount', 0] } },
      totalWithdraw: { $sum: { $cond: [{ $eq: ['$type', 'Withdrawal'] }, '$amount', 0] } }
    }}
  ]);

  const totalSavings = savingsData.length > 0 ? savingsData[0].totalDeposit - savingsData[0].totalWithdraw : 0;
  const remainingBalance = salaryAmount - totalExpenses - (savingsData.length > 0 ? savingsData[0].totalDeposit : 0);

  const monthName = `${MONTH_NAMES[archiveMonth - 1]} ${archiveYear}`;

  const archive = await MonthlyArchive.create({
    user: userId,
    monthName,
    month: archiveMonth,
    year: archiveYear,
    salary: salaryAmount,
    totalExpenses,
    totalSavings,
    remainingBalance,
    categoryBreakdown,
    expenseCount
  });

  return archive;
};

// @desc    Check if today is the 6th (salary day)
// @route   GET /api/salary/status
// @access  Private
const getSalaryStatus = async (req, res) => {
  try {
    const now = new Date();
    const today = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const isSalaryDay = today === 6;

    // Check if salary already submitted for this month
    const existingSalary = await Salary.findOne({ user: req.user._id, month: currentMonth, year: currentYear });

    // Check if previous month needs archiving (auto-archive on first visit on/after 6th)
    if (today >= 6) {
      try {
        await archivePreviousCycle(req.user._id);
      } catch (archiveErr) {
        console.error('Archive error (non-fatal):', archiveErr.message);
      }
    }

    res.json({
      isSalaryDay,
      today,
      currentSalary: existingSalary ? existingSalary.amount : 0,
      hasSalaryThisMonth: !!existingSalary,
      message: isSalaryDay 
        ? (existingSalary ? 'Salary already updated for this month' : 'Today is salary day! Update your salary now.')
        : `Salary can only be updated on the 6th (${6 - today > 0 ? 6 - today : 30 + 6 - today} days left)`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add or update salary (only on the 6th)
// @route   POST /api/salary
// @access  Private
const addSalary = async (req, res) => {
  const { amount, month, year } = req.body;

  // Enforce: salary can only be updated on the 6th
  const today = new Date().getDate();
  if (today !== 6) {
    return res.status(403).json({ 
      message: 'Salary can only be updated on the 6th of each month.',
      nextSalaryDay: today < 6 ? `${6 - today} days left` : `Next month on the 6th`
    });
  }

  try {
    // Auto-archive the previous cycle before saving new salary
    await archivePreviousCycle(req.user._id);

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
    // Enforce: salary can only be updated on the 6th
    const today = new Date().getDate();
    if (today !== 6) {
      return res.status(403).json({ message: 'Salary can only be updated on the 6th of each month.' });
    }

    const salary = await Salary.findById(req.params.id);
    if (!salary || salary.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Salary not found' });
    }

    salary.amount = req.body.amount || salary.amount;
    const updatedSalary = await salary.save();
    res.json(updatedSalary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly archives
// @route   GET /api/salary/archives
// @access  Private
const getArchives = async (req, res) => {
  try {
    const archives = await MonthlyArchive.find({ user: req.user._id }).sort({ year: -1, month: -1 });
    res.json(archives);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addSalary, getSalaries, updateSalary, getSalaryStatus, getArchives };
