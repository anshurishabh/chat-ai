const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getGroupMessages, deleteMessage, editMessage, addReaction } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.post('/', protect, sendMessage);
router.get('/:userId', protect, getMessages);
router.get('/group/:groupId', protect, getGroupMessages);
router.delete('/:id', protect, deleteMessage);
router.put('/:id', protect, editMessage);
router.post('/:id/reaction', protect, addReaction);

module.exports = router;