const Settings = require('../models/Settings');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id });
    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id });
    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }

    const { darkMode, currency, notificationsEnabled } = req.body;
    
    settings.darkMode = darkMode !== undefined ? darkMode : settings.darkMode;
    settings.currency = currency || settings.currency;
    settings.notificationsEnabled = notificationsEnabled !== undefined ? notificationsEnabled : settings.notificationsEnabled;

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
