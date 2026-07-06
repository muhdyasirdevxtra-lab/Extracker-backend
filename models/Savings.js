const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Deposit', 'Withdrawal'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  remark: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Savings', savingsSchema);
