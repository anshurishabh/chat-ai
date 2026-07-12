const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  content: { type: String, default: '' },
  encryptedContent: { type: String, default: '' },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'pdf', 'code', 'ai-image'],
    default: 'text'
  },
  fileUrl: { type: String, default: '' },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  isForwarded: { type: Boolean, default: false },
  label: { type: String, default: null },
  isSelfDestruct: { type: Boolean, default: false },
  selfDestructAt: { type: Date, default: null },
  scheduledAt: { type: Date, default: null },
  isScheduled: { type: Boolean, default: false },
  isSent: { type: Boolean, default: true },
  sentiment: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);