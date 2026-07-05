const mongoose = require('mongoose');

const starredMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
  label: { type: String, default: '' },
}, { timestamps: true });

starredMessageSchema.index({ user: 1, message: 1 }, { unique: true });

module.exports = mongoose.model('StarredMessage', starredMessageSchema);