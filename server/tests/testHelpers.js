const request = require('supertest');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    ...overrides,
  };
  return await User.create(defaultUser);
};

const loginUser = async (app, credentials) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials);
  
  const cookies = response.headers['set-cookie'];
  return {
    response,
    cookies,
    token: response.body.accessToken, // Optional, depending on your app
  };
};

const createTestConversation = async (members = [], isGroup = false, name = '') => {
  return await Conversation.create({
    isGroup,
    name,
    members,
    admin: isGroup ? members[0] : null,
  });
};

const createTestMessage = async (senderId, conversationId, content = 'Test message', type = 'text') => {
  return await Message.create({
    sender: senderId,
    conversationId,
    content,
    type,
    readBy: [senderId],
  });
};

module.exports = {
  createTestUser,
  loginUser,
  createTestConversation,
  createTestMessage,
};
