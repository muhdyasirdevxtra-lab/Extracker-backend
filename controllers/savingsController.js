const Savings = require('../models/Savings');

// @desc    Get all savings transactions
// @route   GET /api/savings
// @access  Private
const getSavings = async (req, res) => {
  try {
    const savings = await Savings.find({ user: req.user._id }).sort({ date: -1 });
    res.json(savings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add savings transaction
// @route   POST /api/savings
// @access  Private
const addSavings = async (req, res) => {
  try {
    const { type, amount, remark, date } = req.body;
    
    const saving = await Savings.create({
      user: req.user._id,
      type,
      amount,
      remark,
      date: date ? new Date(date) : Date.now()
    });

    res.status(201).json(saving);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update savings transaction
// @route   PUT /api/savings/:id
// @access  Private
const updateSavings = async (req, res) => {
  try {
    const saving = await Savings.findById(req.params.id);

    if (!saving || saving.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    saving.type = req.body.type || saving.type;
    saving.amount = req.body.amount || saving.amount;
    saving.remark = req.body.remark || saving.remark;
    saving.date = req.body.date ? new Date(req.body.date) : saving.date;

    const updatedSaving = await saving.save();
    res.json(updatedSaving);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSavings, addSavings, updateSavings };
