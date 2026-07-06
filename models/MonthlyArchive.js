const mongoose = require('mongoose');

const monthlyArchiveSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  monthName: {
    type: String,  // e.g. "June 2026"
    required: true
  },
  month: {
    type: Number,  // 1-12
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  salary: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  totalSavings: {
    type: Number,
    default: 0
  },
  remainingBalance: {
    type: Number,
    default: 0
  },
  categoryBreakdown: [{
    category: String,
    total: Number
  }],
  expenseCount: {
    type: Number,
    default: 0
  },
  archivedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// One archive per user per month
monthlyArchiveSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyArchive', monthlyArchiveSchema);
