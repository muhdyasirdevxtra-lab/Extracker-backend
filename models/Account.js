const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank', 'UPI', 'Custom'] // Allow custom for future expansion if needed, but primarily these 3
  },
  customName: {
    type: String // In case they want to name their bank
  },
  icon: {
    type: String, // E.g., 'FiCreditCard', 'FiSmartphone', 'FiDollarSign'
    default: 'FiCreditCard'
  },
  color: {
    type: String, // e.g. '#3b82f6'
    default: '#3b82f6'
  },
  balance: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Prevent user from having multiple of the same default type unless it's Custom
accountSchema.index({ user: 1, name: 1 }, { unique: true, partialFilterExpression: { name: { $ne: 'Custom' } } });

module.exports = mongoose.model('Account', accountSchema);
