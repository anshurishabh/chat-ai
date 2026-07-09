
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Split configuration layout block optimization parameters safety array indexing
      token = req.headers.authorization.split(' ')[1]?.trim();
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. Token allocation missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User reference node not found in active database model records.' });
    }

    next();
  } catch (error) {
    console.error("Middleware authorization validation trace anomaly caught:", error.message);
    return res.status(401).json({ message: 'Session validation failed. Re-authenticate account gateway.' });
  }
};

module.exports = { protect };