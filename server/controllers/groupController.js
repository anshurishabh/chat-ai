const Group = require('../models/Group');
const crypto = require('crypto');

const createGroup = async (req, res) => {
  try {
    const { name, description, members, aiPersona, isAiEnabled } = req.body;
    const inviteCode = crypto.randomBytes(6).toString('hex');

    const group = await Group.create({
      name,
      description: description || '',
      admin: req.user._id,
      admins: [req.user._id],
      members: [...(members || []), req.user._id],
      aiPersona: aiPersona || '',
      isAiEnabled: isAiEnabled || false,
      inviteCode,
    });

    const populated = await group.populate('members', 'name avatar');
    res.status(201).json(populated);
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
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.includes(req.user._id)) return res.status(401).json({ message: 'Only admins can add members' });
    if (!group.members.includes(req.body.userId)) {
      group.members.push(req.body.userId);
      await group.save();
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.includes(req.user._id)) return res.status(401).json({ message: 'Only admins can remove members' });
    group.members = group.members.filter(m => m.toString() !== req.params.userId);
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const promoteAdmin = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.admin.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Only group owner can promote admins' });
    if (!group.admins.includes(req.params.userId)) {
      group.admins.push(req.params.userId);
      await group.save();
    }
    res.json({ message: 'Member promoted to admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinByInvite = async (req, res) => {
  try {
    const group = await Group.findOne({ inviteCode: req.params.code });
    if (!group) return res.status(404).json({ message: 'Invalid invite link' });
    if (!group.members.includes(req.user._id)) {
      group.members.push(req.user._id);
      await group.save();
    }
    const populated = await group.populate('members', 'name avatar');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.includes(req.user._id)) return res.status(401).json({ message: 'Only admins can update group' });
    const { name, description, rules, aiPersona, isAiEnabled } = req.body;
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (rules !== undefined) group.rules = rules;
    if (aiPersona !== undefined) group.aiPersona = aiPersona;
    if (isAiEnabled !== undefined) group.isAiEnabled = isAiEnabled;
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addAnnouncement = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.includes(req.user._id)) return res.status(401).json({ message: 'Only admins can make announcements' });
    group.announcements.push({ content: req.body.content, sender: req.user._id });
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const regenerateInvite = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.includes(req.user._id)) return res.status(401).json({ message: 'Admin only' });
    group.inviteCode = require('crypto').randomBytes(6).toString('hex');
    await group.save();
    res.json({ inviteCode: group.inviteCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createGroup, getGroups, addMember, removeMember, promoteAdmin, joinByInvite, updateGroup, addAnnouncement, regenerateInvite };