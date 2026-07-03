const express = require('express');
const router = express.Router();
const {
  register, login, getMe, searchUsers, getRecentContacts,
  updateProfile, setWallpaper, getUserProfile,
  adminGetAllUsers, adminDeleteUser, adminToggleAdmin
} = require('../controllers/authController');
const { blockUser, unblockUser, getBlockedUsers, reportUser } = require('../controllers/blockController');
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

// Admin routes
router.get('/admin/users', protect, adminGetAllUsers);
router.delete('/admin/users/:id', protect, adminDeleteUser);
router.put('/admin/users/:id/toggle-admin', protect, adminToggleAdmin);

module.exports = router;