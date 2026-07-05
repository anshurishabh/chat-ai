const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPoll, votePoll, getPoll, getChatPolls } = require('../controllers/pollController');
const { getNote, updateNote } = require('../controllers/noteController');
const { createEvent, getChatEvents, deleteEvent } = require('../controllers/calendarController');
const { createBill, getChatBills, markPaid } = require('../controllers/billController');
const { starMessage, getStarredMessages } = require('../controllers/starController');

// Polls
router.post('/polls', protect, createPoll);
router.post('/polls/:id/vote', protect, votePoll);
router.get('/polls/:id', protect, getPoll);
router.get('/polls/chat/:chatId', protect, getChatPolls);

// Shared Notes
router.get('/notes/:chatId', protect, getNote);
router.put('/notes/:chatId', protect, updateNote);

// Calendar
router.post('/calendar', protect, createEvent);
router.get('/calendar/:chatId', protect, getChatEvents);
router.delete('/calendar/:id', protect, deleteEvent);

// Bill Split
router.post('/bills', protect, createBill);
router.get('/bills/chat/:chatId', protect, getChatBills);
router.put('/bills/:id/paid/:userId', protect, markPaid);

// Starred Messages
router.post('/star/:id', protect, starMessage);
router.get('/starred', protect, getStarredMessages);

module.exports = router;