const express = require('express');
const router = express.Router();
const {
  getSmartReplies,
  chatWithAI,
  translateMessage,
  detectSentiment,
  summarizeChat,
  correctGrammar,
  generateImage
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/smart-replies', protect, getSmartReplies);
router.post('/chat', protect, chatWithAI);
router.post('/translate', protect, translateMessage);
router.post('/sentiment', protect, detectSentiment);
router.post('/summarize', protect, summarizeChat);
router.post('/grammar', protect, correctGrammar);
router.post('/generate-image', protect, generateImage);

module.exports = router;