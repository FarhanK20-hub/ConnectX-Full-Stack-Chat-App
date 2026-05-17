const express = require('express');
const router = express.Router();
const {
  getConversations,
  createConversation,
  updateGroup,
  leaveGroup,
  deleteConversation,
  togglePinMessage,
  addSticker
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getConversations).post(protect, createConversation);
router.route('/:id/delete').delete(protect, deleteConversation);
router.route('/:id').patch(protect, updateGroup).delete(protect, leaveGroup);
router.route('/:id/pin/:messageId').post(protect, togglePinMessage);
router.route('/:id/stickers').post(protect, addSticker);

module.exports = router;
