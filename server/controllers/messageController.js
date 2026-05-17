const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get all messages in a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const cursor = req.query.cursor;

    let query = { conversationId: req.params.conversationId };

    if (cursor) {
      // Find messages older than the cursor
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name avatar email')
      .populate('replyTo', 'content type')
      .sort({ _id: -1 })
      .limit(limit);

    // Re-sort the fetched chunk to be oldest first for the frontend
    messages.sort((a, b) => a.createdAt - b.createdAt);

    const hasMore = messages.length === limit;
    const nextCursor = messages.length > 0 ? messages[0]._id : null;

    res.json({
      messages,
      nextCursor: hasMore ? nextCursor : null,
      hasMore
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { content, conversationId, type, replyTo, pollData, todoData } = req.body;

    if (!conversationId) {
      res.status(400);
      throw new Error('Invalid data passed into request');
    }

    const newMessage = {
      sender: req.user._id,
      content,
      conversationId,
      type: type || 'text',
      replyTo: replyTo || null,
      pollData: type === 'poll' ? pollData : undefined,
      todoData: type === 'todo' ? todoData : undefined,
      readBy: [req.user._id]
    };

    let message = await Message.create(newMessage);

    message = await message.populate('sender', 'name avatar email');
    if (replyTo) {
      message = await message.populate('replyTo', 'content type');
    }

    // Update latest message and handle streaks for 1-on-1 conversations
    const conversation = await Conversation.findById(conversationId);
    let updatedFields = { lastMessage: message._id };

    if (conversation && !conversation.isGroup) {
      const now = new Date();
      const lastMsgDate = conversation.streak?.lastMessageDate;
      let count = conversation.streak?.count || 0;

      if (!lastMsgDate) {
        count = 1;
      } else {
        const msPerDay = 1000 * 60 * 60 * 24;
        const diffInDays = Math.floor(now.getTime() / msPerDay) - Math.floor(lastMsgDate.getTime() / msPerDay);
        
        if (diffInDays === 1) {
          count += 1;
        } else if (diffInDays > 1) {
          count = 1;
        }
      }

      updatedFields.streak = {
        count,
        lastMessageDate: now,
      };
    }

    const updatedConv = await Conversation.findByIdAndUpdate(
      conversationId, 
      updatedFields,
      { new: true }
    ).populate('members', '-password');

    // Emit socket event if we have the io instance
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', message);
      if (updatedFields.streak) {
        io.to(conversationId).emit('conversation_updated', updatedConv);
      }
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('User not authorized to delete this message');
    }

    message.isDeleted = true;
    message.content = 'Message deleted';
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId.toString()).emit('message_deleted', message._id);
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
};

// @desc    Add or remove reaction from a message
// @route   POST /api/messages/:id/react
// @access  Private
const reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex !== -1) {
      // Remove reaction if it already exists (toggle)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      message.reactions.push({ userId: req.user._id, emoji });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId.toString()).emit('reaction_added', {
        messageId: message._id,
        reactions: message.reactions,
      });
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on a poll
// @route   POST /api/messages/:id/vote
// @access  Private
const voteOnPoll = async (req, res, next) => {
  try {
    const { optionIndex } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message || message.type !== 'poll') {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (optionIndex < 0 || optionIndex >= message.pollData.options.length) {
      return res.status(400).json({ message: 'Invalid option index' });
    }

    const userId = req.user._id.toString();

    // Remove user's vote from all options first (to allow changing vote)
    message.pollData.options.forEach(option => {
      option.votes = option.votes.filter(id => id.toString() !== userId);
    });

    // Add vote to the selected option
    message.pollData.options[optionIndex].votes.push(req.user._id);

    await message.save();

    // Populate needed for emit
    await message.populate('sender', 'name avatar email');
    await message.populate('replyTo', 'content type');
    
    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(message.conversationId.toString()).emit('poll_updated', message);
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle a todo item
// @route   POST /api/messages/:id/todo/toggle
// @access  Private
const toggleTodoItem = async (req, res, next) => {
  try {
    const { itemIndex } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message || message.type !== 'todo') {
      return res.status(404).json({ message: 'Todo list not found' });
    }

    if (itemIndex < 0 || itemIndex >= message.todoData.items.length) {
      return res.status(400).json({ message: 'Invalid item index' });
    }

    const item = message.todoData.items[itemIndex];
    item.isCompleted = !item.isCompleted;
    item.completedBy = item.isCompleted ? req.user._id : null;

    await message.save();

    await message.populate('sender', 'name avatar email');
    await message.populate('replyTo', 'content type');
    await message.populate('todoData.items.completedBy', 'name avatar');
    
    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(message.conversationId.toString()).emit('todo_updated', message);
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage,
  reactToMessage,
  voteOnPoll,
  toggleTodoItem,
};
