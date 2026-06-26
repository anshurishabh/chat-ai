const express = require('express');
const router = express.Router();
const { createGroup, getGroups, addMember } = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createGroup);
router.get('/', protect, getGroups);
router.put('/:id/add-member', protect, addMember);

module.exports = router;