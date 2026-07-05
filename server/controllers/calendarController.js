const CalendarEvent = require('../models/CalendarEvent');

const createEvent = async (req, res) => {
  try {
    const { title, description, startTime, endTime, chatId, participants, color, isAllDay } = req.body;
    const event = await CalendarEvent.create({
      title, description, startTime, endTime, chatId,
      creator: req.user._id,
      participants: [...(participants || []), req.user._id],
      color: color || '#7c3aed',
      isAllDay: isAllDay || false,
    });
    const populated = await event.populate('creator', 'name avatar');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatEvents = async (req, res) => {
  try {
    const events = await CalendarEvent.find({ chatId: req.params.chatId })
      .populate('creator', 'name avatar')
      .sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    await CalendarEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEvent, getChatEvents, deleteEvent };