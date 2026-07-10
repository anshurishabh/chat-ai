const express = require('express');
const router = express.Router();
const {
  register, login, getMe, searchUsers, getRecentContacts,
  updateProfile, setWallpaper, getUserProfile,
  adminGetAllUsers, adminDeleteUser, adminToggleAdmin
} = require('../controllers/authController');
const { blockUser, unblockUser, getBlockedUsers, reportUser } = require('../controllers/blockController');
const { setup2FA, verify2FA, disable2FA, getDevices, removeDevice, getAuditLogs, lockChatChannel, verifyChatLock, toggleAnonymousMode } = require('../controllers/twoFactorController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/search', protect, searchUsers);
router.get('/contacts', protect, getRecentContacts);
router.put('/profile', protect, updateProfile);
router.put('/wallpaper', protect, setWallpaper);
router.get('/user/:id', protect, getUserProfile);

router.put('/block/:userId', protect, blockUser);
router.put('/unblock/:userId', protect, unblockUser);
router.get('/blocked', protect, getBlockedUsers);
router.post('/report/:userId', protect, reportUser);

// Enhanced Security & System Framework Traces
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.get('/2fa/devices', protect, getDevices);
router.delete('/2fa/devices/:deviceId', protect, removeDevice);

// New Tactical Audit & Locks Channels
router.get('/security/audit', protect, getAuditLogs);
router.post('/security/lock-chat', protect, lockChatChannel);
router.post('/security/verify-lock', protect, verifyChatLock);
router.post('/security/anonymous', protect, toggleAnonymousMode);

// Admin channels
router.get('/admin/users', protect, adminGetAllUsers);
router.delete('/admin/users/:id', protect, adminDeleteUser);
router.put('/admin/users/:id/toggle-admin', protect, adminToggleAdmin);

module.exports = router;