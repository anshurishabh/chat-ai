const mongoose = require('mongoose');

const billSplitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: '₹' },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splits: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
  }],
  chatId: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isSettled: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('BillSplit', billSplitSchema);