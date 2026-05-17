const cron = require('node-cron');
const ScheduledMessage = require('../models/ScheduledMessage');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const initMessageScheduler = (io) => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Find messages scheduled to be sent now or in the past
      const messagesToSend = await ScheduledMessage.find({ scheduledAt: { $lte: now } });

      if (messagesToSend.length === 0) return;

      console.log(`Processing ${messagesToSend.length} scheduled messages...`);

      for (const scheduledMsg of messagesToSend) {
        // Create the actual message
        const message = await Message.create({
          sender: scheduledMsg.sender,
          content: scheduledMsg.content,
          conversationId: scheduledMsg.conversationId,
          type: scheduledMsg.type,
          readBy: [scheduledMsg.sender], // sender has read it
        });

        await message.populate('sender', 'name avatar');

        // Update the conversation's latest message
        await Conversation.findByIdAndUpdate(scheduledMsg.conversationId, {
          latestMessage: message._id,
        });

        // Broadcast to clients via socket
        if (io) {
          io.to(scheduledMsg.conversationId.toString()).emit('receive_message', message);
        }

        // Remove the scheduled message since it's sent
        await scheduledMsg.deleteOne();
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  });
};

module.exports = initMessageScheduler;
