const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  chatId: { type: String, required: true },
  color: { type: String, default: '#7c3aed' },
  isAllDay: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);