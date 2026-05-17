const jwt = require('jsonwebtoken');
const User = require('../models/User');

const userSocketMap = new Map(); // userId -> socketId

module.exports = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      // Allow passing token via auth object or cookie
      const token = socket.handshake.auth.token || (socket.handshake.headers.cookie && getCookie(socket.handshake.headers.cookie, 'accessToken'));
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
      
      // Check user ghost mode status
      const user = await User.findById(socket.userId);
      if (user) {
        socket.ghostMode = user.ghostMode;
        if (!user.ghostMode) {
          user.isOnline = true;
          await user.save();
        }
      }
      
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} with socketId: ${socket.id}`);
    
    // Add to mapping
    userSocketMap.set(socket.userId.toString(), socket.id);
    
    // Broadcast user online status if not in ghost mode
    if (!socket.ghostMode) {
      socket.broadcast.emit('user_online', { userId: socket.userId });
    }

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined room ${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('typing_start', ({ conversationId }) => {
      socket.to(conversationId).emit('user_typing', { userId: socket.userId, conversationId });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(conversationId).emit('user_stopped_typing', { userId: socket.userId, conversationId });
    });

    socket.on('message_read', async ({ messageId, conversationId }) => {
      try {
        const Message = require('../models/Message');
        const msg = await Message.findById(messageId);
        if (msg && !msg.readBy.includes(socket.userId)) {
          msg.readBy.push(socket.userId);
          await msg.save();
        }
        socket.to(conversationId).emit('message_seen', { messageId, userId: socket.userId, conversationId });
      } catch (err) {
        console.error('Error marking message read:', err);
      }
    });

    // --- WebRTC Signaling ---
    socket.on('call_user', (data) => {
      // data: { userToCall, signalData, from, name, avatar, type }
      const socketId = userSocketMap.get(data.userToCall.toString());
      if (socketId) {
        io.to(socketId).emit('incoming_call', {
          signal: data.signalData,
          from: data.from, // caller's user id
          name: data.name,
          avatar: data.avatar,
          type: data.type
        });
      }
    });

    socket.on('answer_call', (data) => {
      // data: { to: callerUserId, signal: answerSignal }
      const socketId = userSocketMap.get(data.to.toString());
      if (socketId) {
        io.to(socketId).emit('call_accepted', data.signal);
      }
    });

    socket.on('ice_candidate', (data) => {
      // data: { to: peerUserId, candidate: iceCandidate }
      const socketId = userSocketMap.get(data.to.toString());
      if (socketId) {
        io.to(socketId).emit('ice_candidate', data.candidate);
      }
    });

    socket.on('end_call', (data) => {
      // data: { to: peerUserId }
      const socketId = userSocketMap.get(data.to.toString());
      if (socketId) {
        io.to(socketId).emit('call_ended');
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      userSocketMap.delete(socket.userId.toString());
      
      // Update user status and broadcast if not in ghost mode
      if (!socket.ghostMode) {
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false,
          lastSeen: new Date()
        });
        
        // Broadcast offline status
        io.emit('user_offline', { 
          userId: socket.userId,
          lastSeen: new Date()
        });
      }
    });
  });
};

function getCookie(cookieString, name) {
  const match = cookieString.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}
