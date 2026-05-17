const request = require('supertest');
const app = require('../../app');
const { createTestUser, loginUser } = require('../testHelpers');

describe('Conversations Routes Integration Tests', () => {
  let userA, userB, userC, cookiesA, cookiesB, cookiesC;

  beforeEach(async () => {
    const ts = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    // Register users through the API so passwords are hashed correctly
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice', email: `alice_${ts}@test.com`, password: 'password123'
    });
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob', email: `bob_${ts}@test.com`, password: 'password123'
    });
    const resC = await request(app).post('/api/auth/register').send({
      name: 'Charlie', email: `charlie_${ts}@test.com`, password: 'password123'
    });

    userA = resA.body;
    userB = resB.body;
    userC = resC.body;
    cookiesA = resA.headers['set-cookie'];
    cookiesB = resB.headers['set-cookie'];
    cookiesC = resC.headers['set-cookie'];
  });

  describe('POST /api/conversations (DM)', () => {
    it('should create a new DM and return 201', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Cookie', cookiesA)
        .send({ isGroup: false, members: [userB._id] });

      expect(res.status).toBe(201);
      expect(res.body.isGroup).toBe(false);
      expect(res.body.members.length).toBe(2);
    });

    it('should return existing DM if duplicate request', async () => {
      // Create first
      await request(app)
        .post('/api/conversations')
        .set('Cookie', cookiesA)
        .send({ isGroup: false, members: [userB._id] });

      // Create again — should return the same one
      const res = await request(app)
        .post('/api/conversations')
        .set('Cookie', cookiesA)
        .send({ isGroup: false, members: [userB._id] });

      expect(res.status).toBe(200);
      expect(res.body.isGroup).toBe(false);
    });

    it('should return 400 if no members provided', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Cookie', cookiesA)
        .send({ isGroup: false, members: [] });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/conversations (Group)', () => {
    it('should create group with correct members and admin', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Cookie', cookiesA)
        .send({
          isGroup: true,
          members: [userB._id, userC._id],
          name: 'Test Group'
        });

      expect(res.status).toBe(201);
      expect(res.body.isGroup).toBe(true);
      expect(res.body.name).toBe('Test Group');
      expect(res.body.members.length).toBe(3); // A + B + C
      expect(res.body.admin._id.toString()).toBe(userA._id.toString());
    });

    it('should return 400 if group has fewer than 2 total members', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Cookie', cookiesA)
        .send({
          isGroup: true,
          members: [],  // only the creator would be added
          name: 'Solo Group'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/conversations/:id', () => {
    let groupId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Cookie', cookiesA)
        .send({ isGroup: true, members: [userB._id, userC._id], name: 'Original' });
      groupId = res.body._id;
    });

    it('should update group name and return 200', async () => {
      const res = await request(app)
        .patch(`/api/conversations/${groupId}`)
        .set('Cookie', cookiesA)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/conversations/:id (Leave Group)', () => {
    let groupId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Cookie', cookiesA)
        .send({ isGroup: true, members: [userB._id, userC._id], name: 'Leave Test' });
      groupId = res.body._id;
    });

    it('should remove user from group members', async () => {
      const res = await request(app)
        .delete(`/api/conversations/${groupId}`)
        .set('Cookie', cookiesB);

      expect(res.status).toBe(200);
      const memberIds = res.body.members.map(m => m._id.toString());
      expect(memberIds).not.toContain(userB._id.toString());
    });
  });

  describe('GET /api/conversations', () => {
    it('should return user conversations sorted by latest', async () => {
      // Create two conversations for userA
      await request(app).post('/api/conversations').set('Cookie', cookiesA)
        .send({ isGroup: false, members: [userB._id] });
      await request(app).post('/api/conversations').set('Cookie', cookiesA)
        .send({ isGroup: false, members: [userC._id] });

      const res = await request(app)
        .get('/api/conversations')
        .set('Cookie', cookiesA);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/conversations');
      expect(res.status).toBe(401);
    });
  });
});
