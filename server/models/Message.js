const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'system', 'gif', 'audio', 'poll', 'todo', 'sticker'],
      default: 'text',
    },
    pollData: {
      question: { type: String },
      options: [
        {
          text: { type: String },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        },
      ],
    },
    todoData: {
      title: { type: String },
      items: [
        {
          text: { type: String },
          isCompleted: { type: Boolean, default: false },
          completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
      ],
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        emoji: String,
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);
