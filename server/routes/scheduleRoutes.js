const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ScheduledMessage = require('../models/ScheduledMessage');
const Conversation = require('../models/Conversation');

// @desc    Schedule a new message
// @route   POST /api/schedule
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { conversationId, content, type, scheduledAt } = req.body;

    // Verify conversation exists and user is a member
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    const scheduledMessage = await ScheduledMessage.create({
      sender: req.user._id,
      conversationId,
      content,
      type: type || 'text',
      scheduledAt: scheduledDate
    });

    res.status(201).json(scheduledMessage);
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's pending scheduled messages
// @route   GET /api/schedule
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const messages = await ScheduledMessage.find({ sender: req.user._id })
      .populate('conversationId', 'name isGroup members')
      .sort({ scheduledAt: 1 });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// @desc    Cancel a scheduled message
// @route   DELETE /api/schedule/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const message = await ScheduledMessage.findOne({ _id: req.params.id, sender: req.user._id });
    if (!message) {
      return res.status(404).json({ message: 'Scheduled message not found' });
    }
    
    await message.deleteOne();
    res.json({ message: 'Scheduled message cancelled' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
