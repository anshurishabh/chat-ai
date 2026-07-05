const express = require('express');
const router = express.Router();
const {
  createGroup, getGroups, addMember, removeMember,
  promoteAdmin, joinByInvite, updateGroup, addAnnouncement, regenerateInvite
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createGroup);
router.get('/', protect, getGroups);
router.put('/:id', protect, updateGroup);
router.put('/:id/add-member', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);
router.put('/:id/promote/:userId', protect, promoteAdmin);
router.post('/:id/announcement', protect, addAnnouncement);
router.put('/:id/regenerate-invite', protect, regenerateInvite);
router.post('/join/:code', protect, joinByInvite);

module.exports = router;