const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account' // Optional for backward compatibility, but we will start sending it
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['Food', 'Fuel', 'Travel', 'Medical', 'Shopping', 'Bills', 'Entertainment', 'Investment', 'Education', 'Subscription', 'Others', 'Saving Deposit'],
    required: true
  },
  remark: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'Cash'
  },
  receiptImage: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Index for easier querying by date and category
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
