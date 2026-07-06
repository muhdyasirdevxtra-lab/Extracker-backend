const Account = require('../models/Account');

// @desc    Get user's accounts
// @route   GET /api/accounts
// @access  Private
const getAccounts = async (req, res) => {
  try {
    let accounts = await Account.find({ user: req.user._id });
    
    // Seed default accounts if user has none
    if (accounts.length === 0) {
      const defaultAccounts = [
        { user: req.user._id, name: 'Cash', icon: 'FiDollarSign', color: '#10b981' },
        { user: req.user._id, name: 'Bank', icon: 'FiCreditCard', color: '#3b82f6' },
        { user: req.user._id, name: 'UPI', icon: 'FiSmartphone', color: '#8b5cf6' }
      ];
      accounts = await Account.insertMany(defaultAccounts);
    }
    
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update account balance
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account || account.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const { balance, customName, icon, color } = req.body;

    if (balance !== undefined) account.balance = balance;
    if (customName) account.customName = customName;
    if (icon) account.icon = icon;
    if (color) account.color = color;

    const updatedAccount = await account.save();
    res.json(updatedAccount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAccounts, updateAccount };
