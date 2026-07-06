const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dailyLimit: {
    type: Number,
    default: 1000
  },
  monthlyTarget: {
    type: Number,
    default: 0 // Overall savings target
  },
  categoryLimits: [{
    category: {
      type: String,
      enum: ['Food', 'Fuel', 'Travel', 'Medical', 'Shopping', 'Bills', 'Entertainment', 'Investment', 'Education', 'Subscription', 'Others']
    },
    limit: {
      type: Number,
      required: true
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
