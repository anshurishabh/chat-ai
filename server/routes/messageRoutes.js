const express = require('express');
const router = express.Router();
const {
  sendMessage, getMessages, getGroupMessages, getScheduledMessages,
  deleteMessage, editMessage, addReaction, togglePin,
  getPinnedMessages, searchMessages, getAnalytics
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.post('/', protect, sendMessage);
router.get('/search', protect, searchMessages);
router.get('/pinned', protect, getPinnedMessages);
router.get('/scheduled', protect, getScheduledMessages);
router.get('/analytics', protect, getAnalytics);
router.get('/group/:groupId', protect, getGroupMessages);
router.get('/:userId', protect, getMessages);
router.delete('/:id', protect, deleteMessage);
router.put('/:id', protect, editMessage);
router.post('/:id/reaction', protect, addReaction);
router.put('/:id/pin', protect, togglePin);

module.exports = router;