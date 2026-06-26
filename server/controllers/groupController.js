const Group = require('../models/Group');

const createGroup = async (req, res) => {
  try {
    const { name, description, members, aiPersona, isAiEnabled } = req.body;

    const group = await Group.create({
      name,
      description,
      admin: req.user._id,
      members: [...members, req.user._id],
      aiPersona: aiPersona || '',
      isAiEnabled: isAiEnabled || false
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name avatar')
      .populate('admin', 'name avatar');

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Only admin can add members' });
    }

    group.members.push(req.body.userId);
    await group.save();

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createGroup, getGroups, addMember };