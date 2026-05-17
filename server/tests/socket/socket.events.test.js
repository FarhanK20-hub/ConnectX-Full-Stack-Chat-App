const http = require('http');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const socketHandler = require('../../socket/socket');

describe('Socket.IO Event Tests', () => {
  let httpServer, io, clientA, clientB, userA, userB, conversation, port;

  beforeAll(async () => {
    // Set env for token generation
    process.env.JWT_ACCESS_SECRET = 'test_access_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

    // Create a real HTTP server + Socket.IO
    const app = require('express')();
    httpServer = http.createServer(app);
    io = new Server(httpServer, {
      cors: { origin: '*' },
    });

    socketHandler(io);

    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        port = httpServer.address().port;
        resolve();
      });
    });
  });

  beforeEach(async () => {
    // Create test users in the in-memory DB
    userA = await User.create({ name: 'Alice', email: 'alice@socket.com', password: 'password123' });
    userB = await User.create({ name: 'Bob', email: 'bob@socket.com', password: 'password123' });

    // Create a conversation
    conversation = await Conversation.create({
      isGroup: false,
      members: [userA._id, userB._id],
    });

    // Generate valid JWT tokens
    const tokenA = jwt.sign({ userId: userA._id.toString() }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const tokenB = jwt.sign({ userId: userB._id.toString() }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    // Connect clients
    clientA = ioClient(`http://localhost:${port}`, {
      auth: { token: tokenA },
      transports: ['websocket'],
    });
    clientB = ioClient(`http://localhost:${port}`, {
      auth: { token: tokenB },
      transports: ['websocket'],
    });

    // Wait for both to connect
    await Promise.all([
      new Promise((resolve) => clientA.on('connect', resolve)),
      new Promise((resolve) => clientB.on('connect', resolve)),
    ]);

    // Both join the same conversation room
    clientA.emit('join_conversation', conversation._id.toString());
    clientB.emit('join_conversation', conversation._id.toString());

    // Small delay for room join to process
    await new Promise((r) => setTimeout(r, 100));
  });

  afterEach(async () => {
    if (clientA?.connected) clientA.disconnect();
    if (clientB?.connected) clientB.disconnect();
    await new Promise((r) => setTimeout(r, 100));
  });

  afterAll(async () => {
    io.close();
    httpServer.close();
  });

  // ─── TYPING ──────────────────────────────────────────────
  describe('Typing Events', () => {
    it('clientA emits typing_start → clientB receives user_typing', (done) => {
      clientB.on('user_typing', (data) => {
        expect(data.userId).toBe(userA._id.toString());
        expect(data.conversationId).toBe(conversation._id.toString());
        done();
      });

      clientA.emit('typing_start', { conversationId: conversation._id.toString() });
    });

    it('clientA emits typing_stop → clientB receives user_stopped_typing', (done) => {
      clientB.on('user_stopped_typing', (data) => {
        expect(data.userId).toBe(userA._id.toString());
        expect(data.conversationId).toBe(conversation._id.toString());
        done();
      });

      clientA.emit('typing_stop', { conversationId: conversation._id.toString() });
    });

    it('typing events NOT sent back to the emitting client', (done) => {
      const selfHandler = jest.fn();
      clientA.on('user_typing', selfHandler);

      clientA.emit('typing_start', { conversationId: conversation._id.toString() });

      setTimeout(() => {
        expect(selfHandler).not.toHaveBeenCalled();
        done();
      }, 300);
    });
  });

  // ─── READ RECEIPTS ──────────────────────────────────────
  describe('Read Receipts', () => {
    it('clientB emits message_read → clientA receives message_seen', (done) => {
      const fakeMessageId = new mongoose.Types.ObjectId().toString();

      clientA.on('message_seen', (data) => {
        expect(data.messageId).toBe(fakeMessageId);
        expect(data.userId).toBe(userB._id.toString());
        done();
      });

      clientB.emit('message_read', {
        messageId: fakeMessageId,
        conversationId: conversation._id.toString(),
      });
    });
  });

  // ─── PRESENCE ───────────────────────────────────────────
  describe('Presence Events', () => {
    it('clientA connects → clientB receives user_online event', (done) => {
      // Already connected, but let's test by reconnecting clientA
      clientA.disconnect();

      const tokenA = jwt.sign({ userId: userA._id.toString() }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

      clientB.on('user_online', (data) => {
        expect(data.userId).toBe(userA._id.toString());
        done();
      });

      clientA = ioClient(`http://localhost:${port}`, {
        auth: { token: tokenA },
        transports: ['websocket'],
      });
    });

    it('clientA disconnects → clientB receives user_offline event', (done) => {
      clientB.on('user_offline', (data) => {
        expect(data.userId).toBe(userA._id.toString());
        expect(data.lastSeen).toBeDefined();
        done();
      });

      clientA.disconnect();
    });

    it('User.isOnline and lastSeen updated in DB on disconnect', (done) => {
      clientA.disconnect();

      setTimeout(async () => {
        const user = await User.findById(userA._id);
        expect(user.isOnline).toBe(false);
        expect(user.lastSeen).toBeDefined();
        done();
      }, 500);
    });
  });

  // ─── AUTH GUARD ─────────────────────────────────────────
  describe('Auth Guard', () => {
    it('connection without JWT token is rejected', (done) => {
      const badClient = ioClient(`http://localhost:${port}`, {
        auth: {},
        transports: ['websocket'],
      });

      badClient.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication error');
        badClient.disconnect();
        done();
      });
    });

    it('connection with invalid token is rejected', (done) => {
      const badClient = ioClient(`http://localhost:${port}`, {
        auth: { token: 'totally.invalid.token' },
        transports: ['websocket'],
      });

      badClient.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication error');
        badClient.disconnect();
        done();
      });
    });
  });
});
