const Budget = require('../models/Budget');

// @desc    Get budget settings
// @route   GET /api/budget
// @access  Private
const getBudget = async (req, res) => {
  try {
    let budget = await Budget.findOne({ user: req.user._id });
    
    // Create default budget if not exists
    if (!budget) {
      budget = await Budget.create({ user: req.user._id });
    }
    
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update budget settings
// @route   PUT /api/budget
// @access  Private
const updateBudget = async (req, res) => {
  try {
    const { dailyLimit, monthlyTarget, categoryLimits } = req.body;
    
    let budget = await Budget.findOne({ user: req.user._id });

    if (!budget) {
      budget = await Budget.create({
        user: req.user._id,
        dailyLimit,
        monthlyTarget,
        categoryLimits
      });
    } else {
      budget.dailyLimit = dailyLimit || budget.dailyLimit;
      budget.monthlyTarget = monthlyTarget !== undefined ? monthlyTarget : budget.monthlyTarget;
      budget.categoryLimits = categoryLimits || budget.categoryLimits;
      await budget.save();
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBudget, updateBudget };
