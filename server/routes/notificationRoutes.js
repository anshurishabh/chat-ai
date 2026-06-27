const express = require('express');
const router = express.Router();
const { saveSubscription } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.post('/subscribe', protect, saveSubscription);
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;