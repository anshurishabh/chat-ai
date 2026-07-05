const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
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
    await user.save();

    res.json({
      qrCode: qrCodeUrl,
      secret: secret.base32,
      message: 'Scan QR code with Google Authenticator or Authy'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up. Please set up first.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token.toString(),
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid code. Please try again.' });
    }

    user.twoFactorEnabled = true;
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

    if (!verified) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = '';
    await user.save();

    res.json({ message: '2FA disabled', twoFactorEnabled: false });
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

module.exports = { setup2FA, verify2FA, disable2FA, getDevices, removeDevice, registerDevice };