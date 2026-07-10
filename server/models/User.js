const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: String,
  deviceName: String,
  browser: String,
  ip: String,
  lastActive: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

// Embedded Schema for Security Audit Logs Tracking
const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'LOGIN', '2FA_TOGGLE', 'ANONYMOUS_TOGGLE'
  ipAddress: String,
  deviceInfo: String,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 150 },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: '' },
  devices: [deviceSchema],
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  wallpapers: { type: Map, of: String, default: {} },
  messageStats: {
    totalSent: { type: Number, default: 0 },
    totalReceived: { type: Number, default: 0 },
  },
  
  // Naye Security Fields UI Layer Maps
  isAnonymous: { type: Boolean, default: false },
  protectedChats: { type: Map, of: String, default: {} }, // Key: ChatId, Value: Hashed Chat Password
  auditLogs: [auditLogSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);