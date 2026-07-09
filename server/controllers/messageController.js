
const Message = require('../models/Message');
const User = require('../models/User');

const sendMessage = async (req, res) => {
  try {
    const { receiver, groupId, content, type, fileUrl, isSelfDestruct, selfDestructSeconds, replyTo, scheduledAt } = req.body;

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiver || null,
      groupId: groupId || null,
      content,
      type: type || 'text',
      fileUrl: fileUrl || '',
      isSelfDestruct: isSelfDestruct || false,
      selfDestructAt: isSelfDestruct && selfDestructSeconds ? new Date(Date.now() + selfDestructSeconds * 1000) : null,
      replyTo: replyTo || null,
      scheduledAt: isScheduled ? new Date(scheduledAt) : null,
      isScheduled: isScheduled || false,
      isSent: !isScheduled,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { 'messageStats.totalSent': 1 } });
    if (receiver) await User.findByIdAndUpdate(receiver, { $inc: { 'messageStats.totalReceived': 1 } });

    const populated = await Message.findById(message._id).populate([
      { path: 'sender', select: 'name avatar' },
      { path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'name' } }
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ],
      isDeleted: false,
      isScheduled: false,
    })
      .populate('sender', 'name avatar')
      .populate({ path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'name' } })
      .sort({ createdAt: 1 });

    const now = new Date();
    for (const msg of messages) {
      if (msg.isSelfDestruct && msg.selfDestructAt && msg.selfDestructAt < now) {
        msg.isDeleted = true;
        msg.content = '💣 This message self-destructed';
        await msg.save();
      }
    }

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ groupId, isDeleted: false, isScheduled: false })
      .populate('sender', 'name avatar')
      .populate({ path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'name' } })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getScheduledMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      sender: req.user._id,
      isScheduled: true,
      isSent: false,
    }).sort({ scheduledAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();
    res.json({ _id: message._id, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    message.content = req.body.content;
    message.isEdited = true;
    await message.save();
    const populated = await message.populate('sender', 'name avatar');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addReaction = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    const { emoji } = req.body;
    if (!message) return res.status(404).json({ message: 'Not found' });
    const existing = message.reactions.find(r => r.user.toString() === req.user._id.toString());
    if (existing) {
      if (existing.emoji === emoji) {
        message.reactions = message.reactions.filter(r => r.user.toString() !== req.user._id.toString());
      } else {
        existing.emoji = emoji;
      }
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }
    await message.save();
    const populated = await message.populate('reactions.user', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const togglePin = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Not found' });
    message.isPinned = !message.isPinned;
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPinnedMessages = async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    let query = { isPinned: true, isDeleted: false };
    if (groupId) query.groupId = groupId;
    else if (userId) query.$or = [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id }
    ];
    const messages = await Message.find(query).populate('sender', 'name avatar').sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { query, userId, groupId } = req.query;
    if (!query?.trim()) return res.json([]);
    let filter = { content: { $regex: query, $options: 'i' }, isDeleted: false };
    if (groupId) filter.groupId = groupId;
    else if (userId) filter.$or = [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id }
    ];
    const messages = await Message.find(filter).populate('sender', 'name avatar').sort({ createdAt: -1 }).limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [totalSent, totalReceived, last30Days, mediaCount, reactionCount] = await Promise.all([
      Message.countDocuments({ sender: userId, isDeleted: false }),
      Message.countDocuments({ receiver: userId, isDeleted: false }),
      Message.countDocuments({ sender: userId, createdAt: { $gte: thirtyDaysAgo }, isDeleted: false }),
      Message.countDocuments({ sender: userId, type: { $ne: 'text' }, isDeleted: false }),
      Message.countDocuments({ 'reactions.user': userId }),
    ]);

    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const dailyMessages = await Message.aggregate([
      { $match: { sender: userId, createdAt: { $gte: sevenDaysAgo }, isDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topContacts = await Message.aggregate([
      { $match: { sender: userId, receiver: { $ne: null }, isDeleted: false } },
      { $group: { _id: '$receiver', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', avatar: '$user.avatar', count: 1 } }
    ]);

    res.json({ totalSent, totalReceived, last30Days, mediaCount, reactionCount, dailyMessages, topContacts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getMessages, getGroupMessages, getScheduledMessages, deleteMessage, editMessage, addReaction, togglePin, getPinnedMessages, searchMessages, getAnalytics };