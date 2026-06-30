const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getGroupMessages,
  deleteMessage,
  editMessage,
  addReaction,
  togglePin,
  getPinnedMessages,
  searchMessages
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.post('/', protect, sendMessage);
router.get('/search', protect, searchMessages);
router.get('/pinned', protect, getPinnedMessages);
router.get('/group/:groupId', protect, getGroupMessages);
router.get('/:userId', protect, getMessages);
router.delete('/:id', protect, deleteMessage);
router.put('/:id', protect, editMessage);
router.post('/:id/reaction', protect, addReaction);
router.put('/:id/pin', protect, togglePin);

module.exports = router;