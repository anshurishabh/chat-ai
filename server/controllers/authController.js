
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Please fill all fields' });
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar, bio: user.bio, theme: user.theme, token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });
    res.json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar, bio: user.bio, theme: user.theme, isAdmin: user.isAdmin, token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fixed Search Users Logic with safe query execution validation boundary fallback
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);
    
    const me = await User.findById(req.user._id).select('blockedUsers');
    // Ensure blocked array list fallback parameter is safely mapped as array list index parameters
    const blockedList = me && me.blockedUsers ? me.blockedUsers : [];

    const users = await User.find({
      _id: { $ne: req.user._id, $nin: blockedList },
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } }
      ]
    }).select('name email avatar bio isOnline lastSeen').limit(15);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecentContacts = async (req, res) => {
  try {
    const Message = require('../models/Message');
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      isDeleted: false
    }).sort({ createdAt: -1 });

    const contactIds = new Set();
    messages.forEach(m => {
      if (m.sender.toString() !== req.user._id.toString()) contactIds.add(m.sender.toString());
      if (m.receiver && m.receiver.toString() !== req.user._id.toString()) contactIds.add(m.receiver.toString());
    });

    const contacts = await User.find({ _id: { $in: Array.from(contactIds) } }).select('-password -blockedUsers');
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar, theme } = req.body;
    const user = await User.findById(req.user._id);
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (theme !== undefined) user.theme = theme;
    await user.save();
    const safeUser = await User.findById(user._id).select('-password');
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setWallpaper = async (req, res) => {
  try {
    const { chatId, wallpaperUrl } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.wallpapers) user.wallpapers = new Map();
    if (wallpaperUrl) user.wallpapers.set(chatId, wallpaperUrl);
    else user.wallpapers.delete(chatId);
    await user.save();
    res.json({ wallpapers: Object.fromEntries(user.wallpapers) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email avatar bio isOnline lastSeen createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adminGetAllUsers = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adminDeleteUser = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete admin' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adminToggleAdmin = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isAdmin = !user.isAdmin;
    await user.save();
    res.json({ message: `User ${user.isAdmin ? 'promoted to' : 'removed from'} admin`, isAdmin: user.isAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register, login, getMe, searchUsers, getRecentContacts,
  updateProfile, setWallpaper, getUserProfile,
  adminGetAllUsers, adminDeleteUser, adminToggleAdmin
};