const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `NexChat (${req.user.email})`,
      issuer: 'NexChat',
    });
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    const user = await User.findById(req.user._id);
    user.twoFactorSecret = secret.base32;
    
    // Log Security Action
    user.auditLogs.push({
      action: '2FA_SETUP_INITIATED',
      ipAddress: req.ip || '127.0.0.1',
      deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    });
    await user.save();

    res.json({ qrCode: qrCodeUrl, secret: secret.base32 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.twoFactorSecret) return res.status(400).json({ message: '2FA not set up' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token.toString(),
      window: 2,
    });

    if (!verified) return res.status(400).json({ message: 'Invalid code' });

    user.twoFactorEnabled = true;
    user.auditLogs.push({
      action: '2FA_ENABLED_SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
      deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    });
    await user.save();

    res.json({ message: '2FA enabled successfully', twoFactorEnabled: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token.toString(),
      window: 2,
    });

    if (!verified) return res.status(400).json({ message: 'Invalid code' });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = '';
    user.auditLogs.push({
      action: '2FA_DISABLED',
      ipAddress: req.ip || '127.0.0.1',
      deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    });
    await user.save();

    res.json({ message: '2FA disabled', twoFactorEnabled: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Security Feature: Fetch Account Audit Logs
const getAuditLogs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('auditLogs');
    res.json(user.auditLogs || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Security Feature: Toggle Password Protection on Chat
const lockChatChannel = async (req, res) => {
  try {
    const { chatId, password } = req.body;
    if (!chatId || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findById(req.user._id);
    if (!user.protectedChats) user.protectedChats = new Map();

    const salt = await bcrypt.genSalt(10);
    const hashedChatPassword = await bcrypt.hash(password, salt);

    user.protectedChats.set(chatId, hashedChatPassword);
    user.auditLogs.push({
      action: `CHAT_LOCKED: ${chatId}`,
      ipAddress: req.ip || '127.0.0.1',
      deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    });
    await user.save();
    res.json({ message: 'Chat secure lock established successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Security Feature: Verify Chat Password
const verifyChatLock = async (req, res) => {
  try {
    const { chatId, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.protectedChats || !user.protectedChats.get(chatId)) {
      return res.json({ unlocked: true });
    }

    const isMatch = await bcrypt.compare(password, user.protectedChats.get(chatId));
    if (!isMatch) return res.status(400).json({ message: 'Access Denied. Incorrect chat key.' });

    res.json({ unlocked: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Security Feature: Toggle Anonymous Mode
const toggleAnonymousMode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isAnonymous = !user.isAnonymous;
    user.auditLogs.push({
      action: `ANONYMOUS_MODE_TOGGLE: ${user.isAnonymous}`,
      ipAddress: req.ip || '127.0.0.1',
      deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    });
    await user.save();
    res.json({ isAnonymous: user.isAnonymous, name: user.isAnonymous ? 'Anonymous Ghost' : user.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('devices');
    res.json(user.devices || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeDevice = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.devices = user.devices.filter(d => d.deviceId !== req.params.deviceId);
    await user.save();
    res.json({ message: 'Device removed', devices: user.devices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerDevice = async (userId, deviceInfo) => {
  try {
    const user = await User.findById(userId);
    const existingDevice = user.devices.find(d => d.deviceId === deviceInfo.deviceId);
    if (!existingDevice) {
      user.devices.push(deviceInfo);
      if (user.devices.length > 10) user.devices.shift();
      await user.save();
    } else {
      existingDevice.lastActive = new Date();
      await user.save();
    }
  } catch (error) {
    console.error('Device registration error:', error);
  }
};

module.exports = { setup2FA, verify2FA, disable2FA, getDevices, removeDevice, registerDevice, getAuditLogs, lockChatChannel, verifyChatLock, toggleAnonymousMode };