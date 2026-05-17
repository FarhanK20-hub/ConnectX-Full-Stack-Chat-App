const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');

// @desc    Get all conversations for a user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user._id] },
    })
      .populate('members', 'name avatar email isOnline lastSeen')
      .populate('admin', 'name avatar email')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new conversation (DM or Group)
// @route   POST /api/conversations
// @access  Private
const createConversation = async (req, res, next) => {
  try {
    const { isGroup, members, name, avatar } = req.body;

    if (!members || members.length === 0) {
      res.status(400);
      throw new Error('Please provide members');
    }

    // Add current user to members array
    const allMembers = [...new Set([...members, req.user._id.toString()])];

    if (isGroup) {
      if (allMembers.length < 2) {
        res.status(400);
        throw new Error('More than 2 members are required to form a group chat');
      }
      
      const groupChat = await Conversation.create({
        isGroup: true,
        name: name || 'Group Chat',
        avatar: avatar || '',
        members: allMembers,
        admin: req.user._id,
      });

      const fullGroupChat = await Conversation.findById(groupChat._id)
        .populate('members', '-password')
        .populate('admin', '-password');

      return res.status(201).json(fullGroupChat);
    } else {
      // 1-on-1 chat
      const receiverId = members[0];
      
      // Check if conversation already exists
      const existingConversation = await Conversation.find({
        isGroup: false,
        $and: [
          { members: { $elemMatch: { $eq: req.user._id } } },
          { members: { $elemMatch: { $eq: receiverId } } },
        ],
      })
        .populate('members', '-password')
        .populate('lastMessage');

      if (existingConversation.length > 0) {
        return res.json(existingConversation[0]);
      }

      const newConversation = await Conversation.create({
        isGroup: false,
        members: [req.user._id, receiverId],
      });

      const fullConversation = await Conversation.findById(newConversation._id).populate(
        'members',
        '-password'
      );

      return res.status(201).json(fullConversation);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update group conversation (name, avatar)
// @route   PATCH /api/conversations/:id
// @access  Private
const updateGroup = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    const updatedGroup = await Conversation.findByIdAndUpdate(
      req.params.id,
      { name, avatar },
      { new: true }
    )
      .populate('members', '-password')
      .populate('admin', '-password');

    if (!updatedGroup) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    res.json(updatedGroup);
  } catch (error) {
    next(error);
  }
};

// @desc    Leave/Remove from group conversation
// @route   DELETE /api/conversations/:id
// @access  Private
const leaveGroup = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    if (!conversation.isGroup) {
      res.status(400);
      throw new Error('Cannot leave a 1-on-1 conversation');
    }

    // Check if user is in group
    const isMember = conversation.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(400);
      throw new Error('You are not a member of this group');
    }

    // Remove user
    const updatedGroup = await Conversation.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: req.user._id } },
      { new: true }
    )
      .populate('members', '-password')
      .populate('admin', '-password');

    res.json(updatedGroup);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a conversation and all its messages completely
// @route   DELETE /api/conversations/:id/delete
// @access  Private
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    // Check if user is in conversation
    const isMember = conversation.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      throw new Error('You are not authorized to delete this conversation');
    }

    // Delete all messages associated with the conversation
    await Message.deleteMany({ conversationId: conversation._id });

    // Delete the conversation itself
    await Conversation.findByIdAndDelete(conversation._id);

    // Emit socket event to notify other users in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(conversation._id.toString()).emit('conversation_deleted', conversation._id);
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Pin or unpin a message
// @route   POST /api/conversations/:id/pin/:messageId
// @access  Private
const togglePinMessage = async (req, res, next) => {
  try {
    const { id, messageId } = req.params;
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check membership
    if (!conversation.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = await Message.findById(messageId);
    if (!message || message.conversationId.toString() !== id) {
      return res.status(404).json({ message: 'Message not found in this conversation' });
    }

    const isPinned = conversation.pinnedMessages.includes(messageId);

    if (isPinned) {
      // Unpin
      conversation.pinnedMessages = conversation.pinnedMessages.filter(
        (mId) => mId.toString() !== messageId
      );
    } else {
      // Pin
      conversation.pinnedMessages.push(messageId);
    }

    await conversation.save();

    const populatedConv = await Conversation.findById(id).populate({
      path: 'pinnedMessages',
      populate: { path: 'sender', select: 'name avatar' }
    });

    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(id).emit('conversation_updated', populatedConv);
    }

    res.json(populatedConv);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a custom sticker to a conversation
// @route   POST /api/conversations/:id/stickers
// @access  Private
const addSticker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'Sticker URL is required' });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    conversation.customStickers.push({
      url,
      uploadedBy: req.user._id
    });

    await conversation.save();

    const populatedConv = await Conversation.findById(id)
      .populate('members', '-password')
      .populate('pinnedMessages');

    const reqIo = req.app.get('io');
    if (reqIo) {
      reqIo.to(id).emit('conversation_updated', populatedConv);
    }

    res.json(populatedConv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  createConversation,
  updateGroup,
  leaveGroup,
  deleteConversation,
  togglePinMessage,
  addSticker,
};
