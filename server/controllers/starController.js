const StarredMessage = require('../models/StarredMessage');

const starMessage = async (req, res) => {
  try {
    const existing = await StarredMessage.findOne({ user: req.user._id, message: req.params.id });
    if (existing) {
      await StarredMessage.findByIdAndDelete(existing._id);
      return res.json({ starred: false });
    }
    await StarredMessage.create({ user: req.user._id, message: req.params.id, label: req.body.label || '' });
    res.json({ starred: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStarredMessages = async (req, res) => {
  try {
    const starred = await StarredMessage.find({ user: req.user._id })
      .populate({ path: 'message', populate: { path: 'sender', select: 'name avatar' } })
      .sort({ createdAt: -1 });
    res.json(starred);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { starMessage, getStarredMessages };