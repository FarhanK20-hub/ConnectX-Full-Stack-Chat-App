const mongoose = require('mongoose');

const scheduledMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'system', 'gif', 'audio'],
      default: 'text',
    },
    scheduledAt: {
      type: Date,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ScheduledMessage', scheduledMessageSchema);
