const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  month: {
    type: Number, // 1-12
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Prevent duplicate salaries for the same month/year
salarySchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Salary', salarySchema);
