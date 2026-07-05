const BillSplit = require('../models/BillSplit');

const createBill = async (req, res) => {
  try {
    const { title, totalAmount, currency, splits, chatId } = req.body;
    const bill = await BillSplit.create({
      title, totalAmount, currency: currency || '₹',
      paidBy: req.user._id,
      creator: req.user._id,
      splits, chatId,
    });
    const populated = await bill.populate('splits.user', 'name avatar');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatBills = async (req, res) => {
  try {
    const bills = await BillSplit.find({ chatId: req.params.chatId })
      .populate('paidBy', 'name avatar')
      .populate('splits.user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markPaid = async (req, res) => {
  try {
    const bill = await BillSplit.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Not found' });
    const split = bill.splits.find(s => s.user.toString() === req.params.userId);
    if (split) { split.isPaid = true; split.paidAt = new Date(); }
    const allPaid = bill.splits.every(s => s.isPaid);
    if (allPaid) bill.isSettled = true;
    await bill.save();
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBill, getChatBills, markPaid };