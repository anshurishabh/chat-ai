const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers, updateProfile, setWallpaper, getUserProfile } = require('../controllers/authController');
const { blockUser, unblockUser, getBlockedUsers, reportUser } = require('../controllers/blockController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers);
router.put('/profile', protect, updateProfile);
router.put('/wallpaper', protect, setWallpaper);
router.get('/user/:id', protect, getUserProfile);

router.put('/block/:userId', protect, blockUser);
router.put('/unblock/:userId', protect, unblockUser);
router.get('/blocked', protect, getBlockedUsers);
router.post('/report/:userId', protect, reportUser);

module.exports = router;