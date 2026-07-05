const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  avatar: { type: String, default: '' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  aiPersona: { type: String, default: '' },
  isAiEnabled: { type: Boolean, default: false },
  inviteCode: { type: String, unique: true, sparse: true },
  announcements: [{
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  rules: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);