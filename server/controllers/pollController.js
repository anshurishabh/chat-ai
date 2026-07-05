const Poll = require('../models/Poll');

const createPoll = async (req, res) => {
  try {
    const { question, options, groupId, chatId, allowMultiple, expiresAt } = req.body;
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ message: 'Need question and at least 2 options' });
    }
    const poll = await Poll.create({
      question,
      options: options.map(text => ({ text, votes: [] })),
      creator: req.user._id,
      groupId: groupId || null,
      chatId: chatId || null,
      allowMultiple: allowMultiple || false,
      expiresAt: expiresAt || null,
    });
    const populated = await poll.populate('creator', 'name avatar');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (!poll.isActive) return res.status(400).json({ message: 'Poll has ended' });
    if (poll.expiresAt && poll.expiresAt < new Date()) {
      poll.isActive = false;
      await poll.save();
      return res.status(400).json({ message: 'Poll has expired' });
    }

    if (!poll.allowMultiple) {
      // Remove previous votes
      poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(v => v.toString() !== req.user._id.toString());
      });
    }

    const option = poll.options[optionIndex];
    if (!option) return res.status(400).json({ message: 'Invalid option' });

    const alreadyVoted = option.votes.some(v => v.toString() === req.user._id.toString());
    if (alreadyVoted) {
      option.votes = option.votes.filter(v => v.toString() !== req.user._id.toString());
    } else {
      option.votes.push(req.user._id);
    }

    await poll.save();
    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate('creator', 'name avatar');
    if (!poll) return res.status(404).json({ message: 'Not found' });
    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatPolls = async (req, res) => {
  try {
    const { chatId } = req.params;
    const polls = await Poll.find({ chatId }).populate('creator', 'name avatar').sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPoll, votePoll, getPoll, getChatPolls };