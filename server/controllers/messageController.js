const Message = require('../models/Message');

const sendMessage = async (req, res) => {
  try {
    const { receiver, groupId, content, type, fileUrl, isSelfDestruct, replyTo } = req.body;

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiver || null,
      groupId: groupId || null,
      content,
      type: type || 'text',
      fileUrl: fileUrl || '',
      isSelfDestruct: isSelfDestruct || false,
      replyTo: replyTo || null
    });

    const populated = await message.populate([
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
      isDeleted: false
    })
      .populate('sender', 'name avatar')
      .populate({ path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'name' } })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.find({ groupId, isDeleted: false })
      .populate('sender', 'name avatar')
      .populate({ path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'name' } })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();

    res.json({ _id: message._id, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

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

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Same emoji clicked again = remove reaction
        message.reactions = message.reactions.filter(
          r => r.user.toString() !== req.user._id.toString()
        );
      } else {
        existingReaction.emoji = emoji;
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

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

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

    if (groupId) {
      query.groupId = groupId;
    } else if (userId) {
      query.$or = [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ];
    }

    const messages = await Message.find(query)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { query, userId, groupId } = req.query;

    if (!query || query.trim().length === 0) {
      return res.json([]);
    }

    let filter = {
      content: { $regex: query, $options: 'i' },
      isDeleted: false
    };

    if (groupId) {
      filter.groupId = groupId;
    } else if (userId) {
      filter.$or = [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ];
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getGroupMessages,
  deleteMessage,
  editMessage,
  addReaction,
  togglePin,
  getPinnedMessages,
  searchMessages
};