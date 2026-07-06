const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const Savings = require('../models/Savings');
const Account = require('../models/Account');
const Settings = require('../models/Settings');

/**
 * Get the current cycle's date range.
 * Cycle runs from the 6th of current month to the 5th of the next month.
 * If today is before the 6th, we are still in the previous month's cycle.
 */
const getCycleDates = () => {
  const now = new Date();
  const today = now.getDate();

  let cycleStart, cycleEnd, cycleMonth, cycleYear;

  if (today >= 6) {
    // We are in this month's cycle (e.g., July 6 → Aug 5)
    cycleStart = new Date(now.getFullYear(), now.getMonth(), 6, 0, 0, 0);
    cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 5, 23, 59, 59);
    cycleMonth = now.getMonth() + 1; // 1-indexed
    cycleYear = now.getFullYear();
  } else {
    // We are still in the previous month's cycle (e.g., Jul 1-5 = June cycle)
    cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, 6, 0, 0, 0);
    cycleEnd = new Date(now.getFullYear(), now.getMonth(), 5, 23, 59, 59);
    cycleMonth = now.getMonth(); // Previous month (1-indexed since getMonth is 0-indexed)
    cycleYear = cycleMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
    if (cycleMonth === 0) cycleMonth = 12;
  }

  return { cycleStart, cycleEnd, cycleMonth, cycleYear };
};

// @desc    Get dashboard summary
// @route   GET /api/reports/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cycleStart, cycleEnd, cycleMonth, cycleYear } = getCycleDates();
    const now = new Date();

    // 1. Monthly Salary for this cycle
    const salary = await Salary.findOne({ user: userId, month: cycleMonth, year: cycleYear });
    const monthlySalary = salary ? salary.amount : 0;

    // 2. Total Savings (all-time)
    const savings = await Savings.aggregate([
      { $match: { user: userId } },
      { $group: {
          _id: null,
          totalDeposit: { $sum: { $cond: [{ $eq: ['$type', 'Deposit'] }, '$amount', 0] } },
          totalWithdraw: { $sum: { $cond: [{ $eq: ['$type', 'Withdrawal'] }, '$amount', 0] } }
      }}
    ]);
    
    const totalSavings = savings.length > 0 ? savings[0].totalDeposit - savings[0].totalWithdraw : 0;

    // 3. Expenses for this cycle (today, weekly, monthly)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    const expensesData = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: cycleStart, $lte: cycleEnd } } },
      { $group: {
          _id: null,
          monthlyExpense: { $sum: '$amount' },
          weeklyExpense: { $sum: { $cond: [{ $gte: ['$date', startOfWeek] }, '$amount', 0] } },
          todayExpense: { $sum: { $cond: [{ $gte: ['$date', startOfDay] }, '$amount', 0] } }
      }}
    ]);

    const expData = expensesData.length > 0 ? expensesData[0] : { monthlyExpense: 0, weeklyExpense: 0, todayExpense: 0 };

    // 4. Savings deposits this cycle
    const depositsThisCycle = await Savings.aggregate([
      { $match: { user: userId, type: 'Deposit', date: { $gte: cycleStart, $lte: cycleEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const cycleDeposits = depositsThisCycle.length > 0 ? depositsThisCycle[0].total : 0;
    
    // Remaining Balance = Salary - Expenses - Savings Deposits
    const remainingBalance = monthlySalary - expData.monthlyExpense - cycleDeposits;

    // 5. Get Accounts
    const accounts = await Account.find({ user: userId });

    // 6. Get Settings for limits
    let settings = await Settings.findOne({ user: userId });
    if (!settings) {
      settings = await Settings.create({ user: userId });
    }

    res.json({
      monthlySalary,
      totalSavings,
      remainingBalance,
      todayExpense: expData.todayExpense,
      weeklyExpense: expData.weeklyExpense,
      monthlyExpense: expData.monthlyExpense,
      accounts,
      limits: {
        monthly: settings.monthlyLimit,
        daily: settings.dailyLimit
      },
      cycle: {
        month: cycleMonth,
        year: cycleYear,
        start: cycleStart,
        end: cycleEnd
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chart data (expenses by category for current cycle)
// @route   GET /api/reports/charts
// @access  Private
const getChartData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cycleStart, cycleEnd } = getCycleDates();

    const categoryExpenses = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: cycleStart, $lte: cycleEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    res.json(categoryExpenses.map(c => ({ name: c._id, value: c.total })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get last 6 months spending trend
// @route   GET /api/reports/trend
// @access  Private
const getSpendingTrend = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const trend = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = trend.map(t => ({
      month: monthNames[t._id.month - 1],
      year: t._id.year,
      total: t.total
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current vs last month insights
// @route   GET /api/reports/insights
// @access  Private
const getInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [currentMonth, lastMonth] = await Promise.all([
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startOfCurrentMonth } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: startOfLastMonth, $lt: startOfCurrentMonth } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      currentMonth: currentMonth.map(c => ({ category: c._id, total: c.total })),
      lastMonth: lastMonth.map(c => ({ category: c._id, total: c.total }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardSummary, getChartData, getSpendingTrend, getInsights };
