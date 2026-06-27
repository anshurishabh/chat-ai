const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:nexchat@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const subscriptions = new Map();

const saveSubscription = async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    subscriptions.set(userId, subscription);
    res.json({ message: 'Subscription saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendNotification = async (userId, payload) => {
  try {
    const subscription = subscriptions.get(userId);
    if (!subscription) return;
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error('Push notification error:', error.message);
  }
};

module.exports = { saveSubscription, sendNotification };