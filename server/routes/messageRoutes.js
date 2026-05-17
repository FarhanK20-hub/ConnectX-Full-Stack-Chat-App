const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  deleteMessage,
  reactToMessage,
  voteOnPoll,
  toggleTodoItem,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:conversationId').get(protect, getMessages);
router.route('/').post(protect, sendMessage);
router.route('/:id').delete(protect, deleteMessage);
router.route('/:id/react').post(protect, reactToMessage);
router.route('/:id/vote').post(protect, voteOnPoll);
router.route('/:id/todo/toggle').post(protect, toggleTodoItem);

module.exports = router;
