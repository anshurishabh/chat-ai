const mongoose = require('mongoose');

const sharedNoteSchema = new mongoose.Schema({
  title: { type: String, default: 'Shared Note' },
  content: { type: String, default: '' },
  chatId: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('SharedNote', sharedNoteSchema);