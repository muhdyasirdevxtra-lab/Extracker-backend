const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  darkMode: {
    type: Boolean,
    default: false
  },
  currency: {
    type: String,
    default: 'INR'
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
