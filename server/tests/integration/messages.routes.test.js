const request = require('supertest');
const app = require('../../app');
const { createTestConversation } = require('../testHelpers');

describe('Messages Routes Integration Tests', () => {
  let userA, userB, userC, cookiesA, cookiesB, cookiesC, convAB;

  beforeEach(async () => {
    const ts = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    // Register users through the API
    const resA = await request(app).post('/api/auth/register').send({
      name: 'MsgUserA', email: `msga_${ts}@test.com`, password: 'password123'
    });
    const resB = await request(app).post('/api/auth/register').send({
      name: 'MsgUserB', email: `msgb_${ts}@test.com`, password: 'password123'
    });
    const resC = await request(app).post('/api/auth/register').send({
      name: 'MsgUserC', email: `msgc_${ts}@test.com`, password: 'password123'
    });

    userA = resA.body;
    userB = resB.body;
    userC = resC.body;
    cookiesA = resA.headers['set-cookie'];
    cookiesB = resB.headers['set-cookie'];
    cookiesC = resC.headers['set-cookie'];

    // Create a conversation between A and B
    convAB = await createTestConversation([userA._id, userB._id]);
  });

  describe('POST /api/messages', () => {
    it('should create message and return populated sender', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Cookie', cookiesA)
        .send({ conversationId: convAB._id.toString(), content: 'Hello B!' });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Hello B!');
    });

    it('should return 400 for empty content', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Cookie', cookiesA)
        .send({ conversationId: convAB._id.toString() });

      expect(res.status).toBe(400);
    });

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/messages')
        .send({ conversationId: convAB._id.toString(), content: 'Sneaky' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/messages/:id', () => {
    let msgId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Cookie', cookiesA)
        .send({ conversationId: convAB._id.toString(), content: 'To be deleted' });
      msgId = res.body._id;
    });

    it('should soft-delete own message', async () => {
      const res = await request(app)
        .delete(`/api/messages/${msgId}`)
        .set('Cookie', cookiesA);

      expect(res.status).toBe(200);
      expect(res.body.isDeleted).toBe(true);
      expect(res.body.content).toBe('Message deleted');
    });

    it('should return 403 if trying to delete others message', async () => {
      const res = await request(app)
        .delete(`/api/messages/${msgId}`)
        .set('Cookie', cookiesB);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/messages/:id/react', () => {
    let msgId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Cookie', cookiesA)
        .send({ conversationId: convAB._id.toString(), content: 'React to me' });
      msgId = res.body._id;
    });

    it('should add reaction', async () => {
      const res = await request(app)
        .post(`/api/messages/${msgId}/react`)
        .set('Cookie', cookiesB)
        .send({ emoji: '❤️' });

      expect(res.status).toBe(200);
      expect(res.body.reactions.length).toBe(1);
      expect(res.body.reactions[0].emoji).toBe('❤️');
    });

    it('should toggle off if same reaction sent again', async () => {
      await request(app)
        .post(`/api/messages/${msgId}/react`)
        .set('Cookie', cookiesB)
        .send({ emoji: '❤️' });

      const res = await request(app)
        .post(`/api/messages/${msgId}/react`)
        .set('Cookie', cookiesB)
        .send({ emoji: '❤️' });

      expect(res.status).toBe(200);
      expect(res.body.reactions.length).toBe(0);
    });
  });

  describe('GET /api/messages/:conversationId', () => {
    beforeEach(async () => {
      await request(app).post('/api/messages').set('Cookie', cookiesA)
        .send({ conversationId: convAB._id.toString(), content: 'First' });
      await request(app).post('/api/messages').set('Cookie', cookiesB)
        .send({ conversationId: convAB._id.toString(), content: 'Second' });
    });

    it('should return 200 and paginated message object', async () => {
      const res = await request(app)
        .get(`/api/messages/${convAB._id}`)
        .set('Cookie', cookiesA);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBe(2);
      expect(res.body.messages[0].content).toBe('First');
      expect(res.body.messages[1].content).toBe('Second');
      expect(res.body.hasMore).toBeDefined();
    });
  });
});
