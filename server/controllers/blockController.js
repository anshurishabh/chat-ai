const User = require('../models/User');

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = await User.findById(req.user._id);

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    if (!me.blockedUsers.includes(userId)) {
      me.blockedUsers.push(userId);
      await me.save();
    }

    res.json({ message: 'User blocked', blockedUsers: me.blockedUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = await User.findById(req.user._id);

    me.blockedUsers = me.blockedUsers.filter(id => id.toString() !== userId);
    await me.save();

    res.json({ message: 'User unblocked', blockedUsers: me.blockedUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const me = await req.user.populate('blockedUsers', 'name email avatar');
    res.json(me.blockedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reportUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // For a portfolio project we just log it — in production this would
    // write to a Report collection reviewed by moderators.
    console.log(`[REPORT] User ${req.user._id} reported ${userId}. Reason: ${reason}`);

    res.json({ message: 'Report submitted. Our team will review it.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { blockUser, unblockUser, getBlockedUsers, reportUser };